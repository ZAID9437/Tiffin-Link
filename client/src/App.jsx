import React, { useState, useEffect, useCallback, useRef } from 'react';
// Shared UI & Layout Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HangingRopes from './components/HangingRopes';
import StatsBar from './components/StatsBar';
import WhyChoose from './components/WhyChoose';
import Story from './components/Story';
import HangingSpices from './components/HangingSpices';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

// Diners Role Components (For Dinners/)
import MealRequestForm from './For Dinners/MealRequestForm';
import TopProviders from './For Dinners/TopProviders';
import Categories from './For Dinners/Categories';
import FoodSafety from './For Dinners/FoodSafety';

// Providers Role Components (For Providers/)
import ProviderLanding from './For Providers/ProviderLanding';
import BecomeProviderModal from './For Providers/BecomeProviderModal';
import ProviderDashboard from './ProviderDashboard/ProviderDashboard';

// Deliverers Role Components (For Delivers/)
import DeliveryLanding from './For Delivers/DeliveryLanding';
import BecomeDeliveryPartnerModal from './For Delivers/BecomeDeliveryPartnerModal';
import DeliveryDashboard from './DeliveryDashboard/DeliveryDashboard';


// Super Admin Operating System Component
import AdminDashboard from './AdminDashboard/AdminDashboard';
import NearbyTiffinServices from './CustomerExperience/NearbyTiffinServices';
import MyOrdersView from './CustomerExperience/MyOrdersView';
import UserProfileModal from './components/UserProfileModal';

// Shared Animations & Modals
import Preloader from './components/Preloader';
import ParticleBackground from './components/ParticleBackground';
import ScrollMarquee from './components/ScrollMarquee';
import ScrollRopeIndicator from './components/ScrollRopeIndicator';
import LoginModal from './components/LoginModal';
import DemoModal from './components/DemoModal';
import CookieConsentModal from './components/CookieConsentModal';
import CustomerDeliveryTrackingModal from './components/CustomerDeliveryTrackingModal';
import RestaurantDeclineModal from './components/RestaurantDeclineModal';
import CartDrawer from './components/CartDrawer';
import { getSocket, joinCustomerRoom } from './services/socket';

import { useAuth } from './context/AuthContext';
import { clearAuthTokens, getCookie, setCookie, saveUserSession } from './services/api';
import { CheckCircle2 } from 'lucide-react';

// Themed Error Pages & Status Views (Matching exact TiffinLink landing page aesthetic)
import ThemedErrorPage from './components/common/ThemedErrorPage';
import OfflineBanner from './components/common/OfflineBanner';
import ThemedAccountStatePage from './components/account/ThemedAccountStatePage';
import ThemedPaymentResultView from './components/checkout/ThemedPaymentResultView';
import ThemedLegalModal from './components/legal/ThemedLegalModal';

export default function App() {
  const { currentUser, loading: authLoading, loginUser, logoutUser, updateUser } = useAuth();

  // Toast Notification state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const toastTimeoutRef = useRef(null);

  const showToastNotification = useCallback((message, type = 'success') => {
    if (!message) return;
    setToast({
      show: true,
      message,
      type
    });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  }, []);

  // Modal states
  const [loginModalMode, setLoginModalMode] = useState('login');
  const [loginModalRole, setLoginModalRole] = useState('customer');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBecomeProviderModalOpen, setIsBecomeProviderModalOpen] = useState(false);
  const [isBecomeDeliveryPartnerModalOpen, setIsBecomeDeliveryPartnerModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCookieConsentModalOpen, setIsCookieConsentModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalDocId, setLegalModalDocId] = useState('privacy-policy');
  const [isCustomerTrackingModalOpen, setIsCustomerTrackingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState('');
  const [restaurantDeclineData, setRestaurantDeclineData] = useState(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const prevActiveOrderRef = useRef('');
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  const [searchFilters, setSearchFilters] = useState({});

  const openLegalModal = useCallback((docId = 'privacy-policy') => {
    setLegalModalDocId(docId);
    setIsLegalModalOpen(true);
  }, []);

  const openLoginModal = useCallback((mode = 'login', role = 'customer') => {
    if (mode === 'signup' && role === 'provider') {
      setIsBecomeProviderModalOpen(true);
      return;
    }
    if (mode === 'signup' && role === 'delivery') {
      setIsBecomeDeliveryPartnerModalOpen(true);
      return;
    }
    setLoginModalMode(mode);
    setLoginModalRole(role);
    setIsLoginModalOpen(true);
  }, []);

  // Centralized Route Resolution & Route Protection Guard (Section 4 & 12 Specification)
  const resolveRoute = useCallback((hash, user, isAuthRestoring = false) => {
    const rawRole = (user?.role || '').toLowerCase();
    const cleanHash = (hash || (typeof window !== 'undefined' ? window.location.hash : '') || '').toLowerCase();
    const [baseHash] = cleanHash.split('?');

    // Legal & Policy Direct Route Mapping (Checklist Section 6 & 1)
    const legalHashMapping = {
      '#privacy': 'privacy-policy',
      '#privacy-policy': 'privacy-policy',
      '#/privacy': 'privacy-policy',
      '#terms': 'terms',
      '#terms-and-conditions': 'terms',
      '#/terms': 'terms',
      '#cookie-policy': 'cookie-policy',
      '#cookies': 'cookie-policy',
      '#cancellation-refund-policy': 'cancellation-refund-policy',
      '#refund-policy': 'cancellation-refund-policy',
      '#delivery-policy': 'delivery-policy',
      '#pricing-policy': 'pricing-commission-policy',
      '#pricing-commission-policy': 'pricing-commission-policy',
      '#food-safety-disclaimer': 'food-safety-disclaimer',
      '#community-guidelines': 'community-guidelines',
      '#customer-terms': 'customer-terms',
      '#provider-agreement': 'provider-agreement',
      '#delivery-partner-agreement': 'delivery-partner-agreement',
      '#driver-agreement': 'delivery-partner-agreement',
      '#corporate-terms': 'corporate-terms',
      '#group-hostel-terms': 'group-hostel-terms',
      '#provider-subscription-terms': 'provider-subscription-terms'
    };

    if (legalHashMapping[baseHash]) {
      openLegalModal(legalHashMapping[baseHash]);
      return 'home';
    }

    // 0. EXPLICIT ERROR HASHES CANNOT BE ACCESSED VIA URL (Requirement: Error pages only appear on real system/network failure)
    const blockedErrorHashes = [
      '#404', '#/404', '#not-found', '#/not-found',
      '#401', '#/401', '#session-expired', '#/session-expired',
      '#403', '#/403', '#access-denied', '#/access-denied',
      '#500', '#/500', '#server-error', '#/server-error',
      '#503', '#/503', '#maintenance', '#/maintenance',
      '#offline', '#/offline'
    ];
    if (blockedErrorHashes.includes(baseHash)) {
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return 'home';
    }

    if (baseHash.startsWith('#payment-result') || baseHash.startsWith('#/payment-result') || baseHash.startsWith('#order-result') || baseHash.startsWith('#/order-result') || baseHash.startsWith('#order-confirmation')) return 'payment-result';

    const validHomeAnchors = [
      '',
      '#',
      '#home',
      '#/home',
      '#hero',
      '#meal-request',
      '#stats',
      '#why-choose',
      '#food-safety',
      '#story',
      '#contact',
      '#pricing',
      '#top-providers',
      '#categories',
      '#spices',
      '#about'
    ];

    // 1. BEFORE LOGIN (Logged Out State - Requirement 1)
    if (!user) {
      // If auth session is still restoring from MongoDB/JWT, PRESERVE hash and avoid wiping history or opening modals
      if (isAuthRestoring) {
        if (baseHash.startsWith('#orders') || baseHash.startsWith('#my-orders') || baseHash.startsWith('#active-orders') || baseHash.startsWith('#track-order') || baseHash.startsWith('#custom-quotes') || baseHash.startsWith('#meal-quotes') || baseHash.startsWith('#upcoming-tiffins') || baseHash.startsWith('#order-history') || baseHash.startsWith('#cancelled-orders')) return 'orders';
        if (baseHash.startsWith('#/provider') || baseHash.startsWith('#provider')) return 'provider';
        if (baseHash.startsWith('#/delivery') || baseHash.startsWith('#delivery')) return 'delivery';
        if (baseHash.startsWith('#/admin') || baseHash.startsWith('#admin')) return 'admin';
        if (baseHash.startsWith('#find-tiffin') || baseHash.startsWith('#order-tiffin')) return 'find-tiffin';
        if (validHomeAnchors.includes(baseHash)) return 'home';
        return 'home';
      }

      // Guard Protected URLs: Directly entering protected URLs must NOT expose private panels
      if (baseHash.startsWith('#/admin') || baseHash.startsWith('#admin')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);
        openLoginModal('login', 'admin');
        showToastNotification('Administrator authentication required to access Super Admin dashboard.');
        return 'home';
      }
      if (
        baseHash.startsWith('#/provider') || 
        baseHash.startsWith('#provider') || 
        baseHash.startsWith('#my-tiffins') || 
        baseHash.startsWith('#provider-orders') || 
        baseHash.startsWith('#provider-earnings')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#for-providers');
        openLoginModal('login', 'provider');
        showToastNotification('Please log in to your provider account to access the Provider Dashboard.');
        return 'provider'; // Renders ProviderLanding (public)
      }
      if (
        baseHash.startsWith('#/delivery') || 
        baseHash.startsWith('#delivery') || 
        baseHash.startsWith('#my-deliveries') || 
        baseHash.startsWith('#delivery-earnings')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#for-deliverers');
        openLoginModal('login', 'delivery');
        showToastNotification('Please log in to your delivery partner account to access the Delivery Dashboard.');
        return 'delivery'; // Renders DeliveryLanding (public)
      }
      if (
        baseHash.startsWith('#orders') || 
        baseHash.startsWith('#my-orders') || 
        baseHash.startsWith('#active-orders') || 
        baseHash.startsWith('#track-order') || 
        baseHash.startsWith('#custom-quotes') || 
        baseHash.startsWith('#meal-quotes') || 
        baseHash.startsWith('#upcoming-tiffins') || 
        baseHash.startsWith('#order-history') || 
        baseHash.startsWith('#cancelled-orders')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
        openLoginModal('login', 'customer');
        showToastNotification('Please log in to view your orders and dispatch tracker.');
        return 'find-tiffin';
      }

      // Allowed Public Routes
      if (baseHash.startsWith('#for-providers') || baseHash.startsWith('#provider-landing')) return 'provider';
      if (baseHash.startsWith('#for-deliverers') || baseHash.startsWith('#delivery-landing')) return 'delivery';
      if (baseHash.startsWith('#find-tiffin') || baseHash.startsWith('#order-tiffin') || baseHash.startsWith('#for-diners')) return 'find-tiffin';
      if (validHomeAnchors.includes(baseHash)) return 'home';

      // Unrecognized path in URL safely defaults to home rather than exposing error pages
      if (baseHash.startsWith('#')) {
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return 'home';
      }

      return 'home';
    }

    // 2. ADMIN ROLE (Requirement 3 & 5)
    if (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'super_admin') {
      return 'admin';
    }

    // 3. PROVIDER ROLE (Requirement 3 & 5)
    if (rawRole === 'provider') {
      if (baseHash.startsWith('#/admin') || baseHash.startsWith('#admin') || baseHash.startsWith('#delivery') || baseHash.startsWith('#orders')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#provider');
        showToastNotification('Access restricted: Your account is authorized as a Kitchen Provider.');
      }
      return 'provider';
    }

    // 4. DELIVERY PARTNER / DRIVER ROLE (Requirement 3 & 5)
    if (rawRole === 'delivery' || rawRole === 'driver' || rawRole === 'deliverer' || rawRole === 'delivery_partner') {
      if (baseHash.startsWith('#/admin') || baseHash.startsWith('#admin') || baseHash.startsWith('#provider') || baseHash.startsWith('#orders')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#delivery');
        showToastNotification('Access restricted: Your account is authorized as a Delivery Partner.');
      }
      return 'delivery';
    }

    // 5. CUSTOMER / DINER ROLE (Requirement 3 & 5)
    if (baseHash.startsWith('#/admin') || baseHash.startsWith('#admin')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Administrator privileges required.');
      return 'find-tiffin';
    }
    if (baseHash.startsWith('#/provider') || baseHash.startsWith('#provider')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Kitchen Provider account required.');
      return 'find-tiffin';
    }
    if (baseHash.startsWith('#/delivery') || baseHash.startsWith('#delivery')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Delivery Partner account required.');
      return 'find-tiffin';
    }

    if (
      baseHash.startsWith('#orders') || 
      baseHash.startsWith('#my-orders') || 
      baseHash.startsWith('#active-orders') || 
      baseHash.startsWith('#track-order') || 
      baseHash.startsWith('#custom-quotes') || 
      baseHash.startsWith('#meal-quotes') || 
      baseHash.startsWith('#upcoming-tiffins') || 
      baseHash.startsWith('#order-history') || 
      baseHash.startsWith('#cancelled-orders')
    ) {
      return 'orders';
    }

    if (baseHash.startsWith('#find-tiffin') || baseHash.startsWith('#order-tiffin') || baseHash.startsWith('#for-diners')) {
      return 'find-tiffin';
    }

    if (validHomeAnchors.includes(baseHash)) return 'home';

    // Unrecognized hash in URL safely defaults to home rather than exposing error pages
    if (baseHash.startsWith('#')) {
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return 'home';
    }

    return 'home';
  }, [openLoginModal, showToastNotification]);

  // State-based router with security enforcement
  const [view, setView] = useState(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_user') || localStorage.getItem('user')) : null;
    let initialUser = currentUser;
    if (!initialUser && stored) {
      try { initialUser = JSON.parse(stored); } catch (e) {}
    }
    return resolveRoute(typeof window !== 'undefined' ? window.location.hash : '', initialUser, true);
  });

  // Active runtime system/network error state (ONLY displayed when a real error occurs)
  const [activeError, setActiveError] = useState(null);

  useEffect(() => {
    const handleAppError = (event) => {
      if (event && event.detail) {
        setActiveError(event.detail);
      }
    };
    const handleClearAppError = () => {
      setActiveError(null);
    };
    const handleSessionExpired = () => {
      setActiveError({ status: 401 });
    };

    window.addEventListener('tiffinlink:app-error', handleAppError);
    window.addEventListener('tiffinlink:clear-app-error', handleClearAppError);
    window.addEventListener('tiffinlink:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('tiffinlink:app-error', handleAppError);
      window.removeEventListener('tiffinlink:clear-app-error', handleClearAppError);
      window.removeEventListener('tiffinlink:session-expired', handleSessionExpired);
    };
  }, []);

  // Bulletproof Scroll-to-Top helper for instant top alignment
  const scrollToTop = useCallback(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Subsequent animation frame tick to handle post-render DOM height changes
    requestAnimationFrame(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    });

    setTimeout(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }, 40);
  }, []);

  // Prevent browser from restoring bottom/footer scroll position
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    scrollToTop();
  }, [scrollToTop]);

  // Reset scroll position to top whenever view changes
  useEffect(() => {
    scrollToTop();
  }, [view, scrollToTop]);

  // Sync route whenever user session or hash changes
  useEffect(() => {
    if (!authLoading) {
      const targetView = resolveRoute(window.location.hash, currentUser);
      setView(targetView);
    }
  }, [currentUser, authLoading, resolveRoute]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!authLoading) {
        const targetView = resolveRoute(window.location.hash, currentUser);
        setView(targetView);
        scrollToTop();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, authLoading, resolveRoute, scrollToTop]);

  // Handle Login Success: Authoritative Database Role Redirection (Requirement 2 & 3)
  const handleLoginSuccess = async (userObj, accessToken, refreshToken) => {
    const authoritative = await loginUser(userObj, accessToken, refreshToken);
    const resolvedUser = authoritative || userObj;
    setIsLoginModalOpen(false);

    const role = (resolvedUser.role || 'customer').toLowerCase();

    // Check for pending checkout (only for diners)
    const pendingCheckout = localStorage.getItem('tiffinlink_pending_checkout');
    if (pendingCheckout && (role === 'customer' || role === 'diner')) {
      setView('find-tiffin');
      window.location.hash = '#find-tiffin?checkout=true';
      showToastNotification(`Welcome back, ${resolvedUser.name || resolvedUser.email}! Resuming your checkout.`);
      return;
    }

    // Role-based redirection according to specification
    if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
      setView('admin');
      window.location.hash = '#admin';
    } else if (role === 'provider') {
      setView('provider');
      window.location.hash = '#provider';
    } else if (role === 'delivery' || role === 'driver' || role === 'deliverer' || role === 'delivery_partner') {
      setView('delivery');
      window.location.hash = '#delivery';
    } else {
      // Customer / Diner
      setView('find-tiffin');
      window.location.hash = '#find-tiffin';
    }
    showToastNotification(`Welcome back, ${resolvedUser.name || resolvedUser.email}! Signed in successfully.`);
  };

  // Handle Logout: Invalidate session, clear tokens, redirect to public landing (Requirement 7)
  const handleLogout = async () => {
    await logoutUser();
    setView('home');
    window.location.hash = '';
    showToastNotification('You have been signed out.');
  };

  // Centralized Session Expiry listener (Section 4.2 Specification)
  useEffect(() => {
    const handleSessionExpired = () => {
      openLoginModal('login', 'customer');
      showToastNotification('Your session has expired. Please sign in again.');
    };
    window.addEventListener('tiffinlink:session-expired', handleSessionExpired);
    return () => window.removeEventListener('tiffinlink:session-expired', handleSessionExpired);
  }, [openLoginModal, showToastNotification]);

  // Sync active order and real-time decline events for logged-in Diner/Customer
  useEffect(() => {
    if (!currentUser || currentUser.role === 'provider' || currentUser.role === 'delivery') {
      setHasActiveOrder(false);
      setActiveCustomerOrderId('');
      prevActiveOrderRef.current = '';
      return;
    }

    const customerId = currentUser.id || currentUser._id;
    const email = currentUser.email || '';

    // Join Customer-specific Socket room for real-time order & request updates
    joinCustomerRoom(customerId, email);

    const handleOrderDeclined = (data) => {
      if (!data) return;
      setRestaurantDeclineData({
        orderId: data.orderId || prevActiveOrderRef.current || 'TL-ORDER',
        providerName: data.providerName || 'Kitchen Partner',
        tiffinName: data.tiffinName || 'Tiffin Meal',
        cancellationReason: data.cancellationReason || 'The kitchen is at peak preparation capacity and cannot accept this order right now.',
        totalAmount: data.totalAmount || 0,
        refundNotice: data.refundNotice || '100% Escrow Refund Recredited to Source Account'
      });
      setIsDeclineModalOpen(true);
      setHasActiveOrder(false);
      setActiveCustomerOrderId('');
      prevActiveOrderRef.current = '';
      showToastNotification(`⚠️ ${data.providerName || 'Kitchen'} was unable to accept your order. 100% refunded.`);
    };

    const handleRequestDeclined = (data) => {
      if (!data) return;
      setRestaurantDeclineData({
        orderId: data.requestId || 'REQ-CUSTOM',
        providerName: data.providerName || 'Kitchen Partner',
        tiffinName: data.mealType ? `${data.mealType} Meal Request` : 'Custom Meal Request',
        cancellationReason: data.reason || 'The kitchen was unable to fulfill your custom meal request at this time.',
        totalAmount: 0,
        refundNotice: 'No payment deducted for unaccepted requests.'
      });
      setIsDeclineModalOpen(true);
      showToastNotification(`⚠️ Custom request declined by kitchen.`);
    };

    const handleStatusUpdated = (data) => {
      if (data && (String(data.status).toLowerCase() === 'cancelled' || String(data.status).toLowerCase() === 'rejected') && data.cancelledBy === 'Provider') {
        handleOrderDeclined(data);
      }
    };

    const socket = getSocket();
    socket.on('order:declined', handleOrderDeclined);
    socket.on('order:status:updated', handleStatusUpdated);
    socket.on('request:declined', handleRequestDeclined);

    const checkActiveOrder = async () => {
      try {
        const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:5000/api/orders/my-orders?email=${encodeURIComponent(email)}`, { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const terminal = ['delivered', 'completed', 'cancelled', 'rejected', 'failed', 'payment_failed', 'delivery_failed'];
          const active = json.data.find(o => !terminal.includes(String(o.status || '').toLowerCase().trim()));

          // Check if previously tracked active order was declined while diner was on another view or disconnected
          if (prevActiveOrderRef.current && !active) {
            const declinedOrder = json.data.find(o => 
              (o.orderId === prevActiveOrderRef.current || o._id === prevActiveOrderRef.current) &&
              (String(o.status || '').toLowerCase() === 'cancelled' || String(o.status || '').toLowerCase() === 'rejected') &&
              (o.cancelledBy === 'Provider' || o.cancellationReason)
            );
            if (declinedOrder && !isDeclineModalOpen) {
              handleOrderDeclined({
                orderId: declinedOrder.orderId || prevActiveOrderRef.current,
                providerName: declinedOrder.providerName || 'Kitchen Partner',
                tiffinName: declinedOrder.tiffinName || 'Tiffin Meal',
                cancellationReason: declinedOrder.cancellationReason || 'The kitchen is at peak preparation capacity and cannot accept this order right now.',
                totalAmount: declinedOrder.totalAmount || 0,
                refundNotice: '100% Escrow Refund Recredited to Source Account'
              });
            }
          }

          if (active) {
            setHasActiveOrder(true);
            const activeId = active.orderId || active._id;
            setActiveCustomerOrderId(activeId);
            prevActiveOrderRef.current = activeId;
          } else {
            setHasActiveOrder(false);
            setActiveCustomerOrderId('');
            prevActiveOrderRef.current = '';
          }
        }
      } catch (err) {
        console.warn('Active order check warning:', err);
      }
    };

    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 4000);
    return () => {
      clearInterval(interval);
      socket.off('order:declined', handleOrderDeclined);
      socket.off('order:status:updated', handleStatusUpdated);
      socket.off('request:declined', handleRequestDeclined);
    };
  }, [currentUser, isDeclineModalOpen]);



  const handleRequestSubmitSuccess = (formData) => {
    if (formData && typeof formData === 'object') {
      setSearchFilters(formData);
    }
    setView('find-tiffin');
    window.location.hash = '#find-tiffin';
    showToastNotification('Matching providers found nearby!');
  };

  const handleSelectTopProvider = (provider) => {
    setSearchFilters({
      selectedProviderId: provider._id,
      selectedProvider: provider,
      location: provider.address?.locality ? `${provider.address.locality}, Ahmedabad` : 'Satellite, Ahmedabad',
      mealType: provider.tags?.[0]?.includes('Pure Veg') ? 'Veg Tiffin' : (provider.tags?.[0]?.includes('Jain') ? 'Jain Tiffin' : 'Non-Veg Tiffin')
    });
    setView('find-tiffin');
    window.location.hash = `#find-tiffin?provider=${provider._id}`;
  };

  const handleBecomeProviderSuccess = () => {
    showToastNotification('Kitchen Registered Successfully! Your kitchen is now live.');
  };

  const handleBecomeDeliveryPartnerSuccess = () => {
    showToastNotification('Delivery Partner application submitted! Onboarding team will contact you.');
  };

  const handlePreloaderComplete = () => {
    setPreloaderFinished(true);
    // Smooth reveal for hero on load
    const heroContent = document.getElementById('hero-content');
    if (heroContent) {
      setTimeout(() => {
        heroContent.classList.add('active');
        // Trigger character active states
        heroContent.querySelectorAll('.reveal-char').forEach(char => {
          char.classList.add('active');
        });
      }, 300);
    }
  };

  // Setup Custom Cursor, Reveal on Scroll, Magnetic pull, and Parallax effects
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDashboard = !!(currentUser && (currentUser.role === 'provider' || currentUser.role === 'admin' || currentUser.role === 'delivery'));

    // 1. Spring-Physics Custom Cursor
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    const cursorText = document.getElementById('cursor-text');

    if (isDashboard) {
      if (cursor) cursor.style.display = 'none';
      if (follower) follower.style.display = 'none';
      return;
    } else {
      if (cursor && !isMobile) cursor.style.display = '';
      if (follower && !isMobile) follower.style.display = '';
    }

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;
    let rafId;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursor && !isMobile) {
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
      }
    };

    const updateFollowerPosition = () => {
      if (follower && !isMobile) {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
      }
      rafId = requestAnimationFrame(updateFollowerPosition);
    };

    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      rafId = requestAnimationFrame(updateFollowerPosition);
    }

    // 2. Cursor state listeners (hover blends)
    const handleMouseOver = (e) => {
      if (isMobile || !cursor || !follower || !cursorText) return;

      const target = e.target;
      const providerTarget = target.closest('.cursor-hover-provider');
      const categoryTarget = target.closest('.cursor-hover-category');
      const interactiveTarget = target.closest('a, button');

      if (providerTarget) {
        follower.classList.add('hovering-provider');
        cursorText.innerText = 'VIEW';
      } else {
        follower.classList.remove('hovering-provider');
      }

      if (categoryTarget) {
        follower.classList.add('hovering-category');
        cursorText.innerText = 'EXPLORE';
      } else {
        follower.classList.remove('hovering-category');
      }

      if (providerTarget || categoryTarget) {
        cursor.classList.add('cursor-hidden');
      } else {
        cursor.classList.remove('cursor-hidden');
      }

      if (interactiveTarget && !providerTarget && !categoryTarget) {
        cursor.classList.add('hovering-link');
        follower.classList.add('hovering-link');
      } else {
        cursor.classList.remove('hovering-link');
        follower.classList.remove('hovering-link');
      }
    };

    if (!isMobile) {
      document.addEventListener('mouseover', handleMouseOver);
    }

    // 3. Magnetic pull effect for buttons
    const handleMagneticMove = (e) => {
      if (isMobile) return;
      const magneticElements = document.querySelectorAll('.magnetic');
      magneticElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elX = rect.left + rect.width / 2;
        const elY = rect.top + rect.height / 2;

        const dx = e.clientX - elX;
        const dy = e.clientY - elY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 70) {
          el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
          el.style.transition = 'transform 0.1s ease-out';
        } else {
          el.style.transform = 'translate(0, 0)';
          el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        }
      });
    };

    if (!isMobile) {
      document.addEventListener('mousemove', handleMagneticMove);
    }

    // 4. Reveal on Scroll (staggered and chars)
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          if (entry.target.classList.contains('reveal-text')) {
            entry.target.querySelectorAll('.reveal-char').forEach(char => {
              char.classList.add('active');
            });
          }
        }
      });
    }, observerOptions);

    // Initial character-splitting animation setup for elements marked as .reveal-text
    const textRevealElements = document.querySelectorAll('.reveal-text');
    textRevealElements.forEach(element => {
      if (element.querySelector('.reveal-char')) return; // Prevent duplicate split
      const text = element.textContent || '';
      element.innerHTML = '';
      const words = text.split(' ');
      let charIndex = 0;
      
      words.forEach((word, wordIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'inline-block whitespace-nowrap';
        
        word.split('').forEach((char) => {
          const span = document.createElement('span');
          span.textContent = char;
          span.className = 'reveal-char';
          span.style.transitionDelay = `${charIndex * 15}ms`;
          wordSpan.appendChild(span);
          charIndex++;
        });
        
        element.appendChild(wordSpan);
        
        // Add a space after the word if it's not the last word
        if (wordIdx < words.length - 1) {
          const space = document.createElement('span');
          space.textContent = '\u00A0'; // non-breaking space
          space.className = 'reveal-char';
          space.style.transitionDelay = `${charIndex * 15}ms`;
          element.appendChild(space);
          charIndex++;
        }
      });
      observer.observe(element);
    });

    const scrollElements = document.querySelectorAll('.reveal-on-scroll, .line-draw');
    scrollElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 150) {
        el.classList.add('active');
      }
      observer.observe(el);
    });

    // 5. Parallax scroll elements (optimized with requestAnimationFrame and GPU acceleration)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const parallaxElements = document.querySelectorAll('.parallax-img');
          parallaxElements.forEach(parallax => {
            const speed = parseFloat(parallax.getAttribute('data-parallax-speed') || '0.12');
            const parent = parallax.parentElement;
            if (!parent) return;
            
            const rect = parent.getBoundingClientRect();
            // Check if the element is near the top of the page (Hero)
            const isHero = parent.tagName === 'HEADER' || parent.classList.contains('hero-section') || (rect.top + window.scrollY < window.innerHeight);
            
            if (isHero) {
              // Top of page parallax uses absolute scroll position
              let scrollPosition = window.pageYOffset;
              parallax.style.transform = `scale(1.25) translate3d(0, ${scrollPosition * speed}px, 0)`;
            } else {
              // Bottom/middle of page parallax uses centered viewport scroll position
              const sectionCenter = rect.top + rect.height / 2;
              const viewportCenter = window.innerHeight / 2;
              const diff = sectionCenter - viewportCenter;
              
              // Apply centered translation (moving opposite to the scroll displacement)
              const translateY = -diff * speed;
              parallax.style.transform = `scale(1.25) translate3d(0, ${translateY}px, 0)`;
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (!isMobile) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousemove', handleMagneticMove);
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      scrollElements.forEach(el => observer.unobserve(el));
      textRevealElements.forEach(el => observer.unobserve(el));
    };
  }, [view, currentUser]);



  // While verifying session on page reload/refresh, render loading state so no routes reset prematurely
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fbf9f5] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#665d52]">
          Restoring Session...
        </span>
      </div>
    );
  }

  // Only authenticated Super Admin can access Admin Dashboard Control Center
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'super_admin')) {
    return (
      <div className="app-layout">
        <OfflineBanner />
        <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
        <CookieConsentModal 
          isOpenOverride={isCookieConsentModalOpen}
          onCloseOverride={() => setIsCookieConsentModalOpen(false)}
        />
        {/* Toast Alerts */}
        <div className={`toast toast-success ${toast.show ? 'show' : ''}`}>
          <CheckCircle2 className="text-emerald" size={20} />
          <span>{toast.message}</span>
        </div>
      </div>
    );
  }

  // Only authenticated Provider can access Provider Kitchen Portal Dashboard
  if (currentUser && currentUser.role === 'provider') {
    // Check if Provider Account is pending verification or audit
    if (currentUser.status === 'pending' || currentUser.verificationStatus === 'pending') {
      return (
        <div className="app-layout">
          <OfflineBanner />
          <ThemedAccountStatePage 
            stateKey="provider_pending"
            user={currentUser}
            onNavigateHome={handleLogout}
            onOpenSupport={() => { window.location.hash = '#contact'; }}
          />
          {toast.show && (
            <div className="fixed bottom-6 right-6 z-[9999] bg-[#1A1A1A] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      );
    }

    // Check if Provider Account is suspended or inactive
    if (currentUser.status === 'suspended' || currentUser.isActive === false) {
      return (
        <div className="app-layout">
          <OfflineBanner />
          <ThemedAccountStatePage 
            stateKey="suspended"
            user={currentUser}
            onNavigateHome={handleLogout}
            onOpenSupport={() => { window.location.hash = '#contact'; }}
          />
          {toast.show && (
            <div className="fixed bottom-6 right-6 z-[9999] bg-[#1A1A1A] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="app-layout">
        <OfflineBanner />
        <ProviderDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onUpdateUser={(updatedUser) => updateUser(updatedUser)}
        />
        <CookieConsentModal 
          isOpenOverride={isCookieConsentModalOpen}
          onCloseOverride={() => setIsCookieConsentModalOpen(false)}
        />
        {/* Toast Alerts */}
        <div className={`toast toast-success ${toast.show ? 'show' : ''}`}>
          <CheckCircle2 className="text-emerald" size={20} />
          <span>{toast.message}</span>
        </div>
      </div>
    );
  }

  // Only authenticated Delivery Partner can access Delivery Dashboard
  if (currentUser && (currentUser.role === 'delivery' || currentUser.role === 'driver' || currentUser.role === 'deliverer' || currentUser.role === 'delivery_partner')) {
    // Check if Delivery Partner is pending verification
    if (currentUser.status === 'pending' || currentUser.verificationStatus === 'pending') {
      return (
        <div className="app-layout">
          <OfflineBanner />
          <ThemedAccountStatePage 
            stateKey="delivery_pending"
            user={currentUser}
            onNavigateHome={handleLogout}
            onOpenSupport={() => { window.location.hash = '#contact'; }}
          />
          {toast.show && (
            <div className="fixed bottom-6 right-6 z-[9999] bg-[#1A1A1A] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      );
    }

    // Check if Delivery Partner is suspended
    if (currentUser.status === 'suspended' || currentUser.isActive === false) {
      return (
        <div className="app-layout">
          <OfflineBanner />
          <ThemedAccountStatePage 
            stateKey="suspended"
            user={currentUser}
            onNavigateHome={handleLogout}
            onOpenSupport={() => { window.location.hash = '#contact'; }}
          />
          {toast.show && (
            <div className="fixed bottom-6 right-6 z-[9999] bg-[#1A1A1A] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="app-layout">
        <OfflineBanner />
        <DeliveryDashboard currentUser={currentUser} onLogout={handleLogout} />
        <CookieConsentModal 
          isOpenOverride={isCookieConsentModalOpen}
          onCloseOverride={() => setIsCookieConsentModalOpen(false)}
        />
        {/* Toast Alerts */}
        <div className={`toast toast-success ${toast.show ? 'show' : ''}`}>
          <CheckCircle2 className="text-emerald" size={20} />
          <span>{toast.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Global Real-Time Offline & Reconnection Banner */}
      <OfflineBanner />

      {/* Original TiffinLink Cinematic Preloader Animation */}
      <Preloader onComplete={handlePreloaderComplete} />

      {/* Floating Spice Canvas Background */}
      <ParticleBackground />

      {/* Hanging Vertical Scroll Indicator Rope */}
      <ScrollRopeIndicator view={view} />

      {/* Navigation */}
      <Navbar 
        onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)} 
        onOpenBecomeDeliveryPartnerModal={() => setIsBecomeDeliveryPartnerModalOpen(true)}
        onOpenLogin={(mode, role) => {
          if (mode === 'signup' && (role === 'provider' || (!role && view === 'provider'))) {
            setIsBecomeProviderModalOpen(true);
            return;
          }
          if (mode === 'signup' && (role === 'delivery' || (!role && view === 'delivery'))) {
            setIsBecomeDeliveryPartnerModalOpen(true);
            return;
          }
          openLoginModal(mode || 'login', role || 'customer');
        }}
        onOpenTrackingModal={() => setIsCustomerTrackingModalOpen(true)}
        onOpenProfileModal={(tab) => {
          setProfileModalTab(tab || 'profile');
          setIsProfileModalOpen(true);
        }}
        hasActiveOrder={hasActiveOrder}
        currentView={activeError ? String(activeError.status) : view}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Sections: If an actual runtime/system error occurred, render ThemedErrorPage */}
      {activeError ? (
        <ThemedErrorPage 
          status={activeError.status || 500} 
          errorId={activeError.errorId}
          customTitle={activeError.title}
          customDescription={activeError.message}
          onNavigateHome={() => {
            setActiveError(null);
            setView('home');
            window.location.hash = '#home';
          }}
          onOpenLogin={() => {
            setActiveError(null);
            openLoginModal('login', 'customer');
          }}
          onOpenContact={() => {
            setActiveError(null);
            setView('home');
            window.location.hash = '#contact';
          }}
        />
      ) : (
        <main>
          {view === 'payment-result' ? (
          <ThemedPaymentResultView 
            orderId={activeCustomerOrderId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('orderId') : '')}
            onViewOrder={(oId) => {
              setActiveCustomerOrderId(oId);
              setIsCustomerTrackingModalOpen(true);
            }}
            onNavigateHome={() => { setView('home'); window.location.hash = '#home'; }}
            onExploreFood={() => { setView('find-tiffin'); window.location.hash = '#find-tiffin'; }}
          />
        ) : view === 'provider' ? (
          <ProviderLanding 
            onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)} 
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
        ) : view === 'delivery' ? (
          <DeliveryLanding
            onOpenBecomeDeliveryPartnerModal={() => setIsBecomeDeliveryPartnerModalOpen(true)}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
        ) : view === 'orders' ? (
          <MyOrdersView 
            currentUser={currentUser} 
            onNavigate={(hash) => { setView(hash.replace(/^#/, '')); window.location.hash = hash; }} 
            onOpenTracking={(orderId) => {
              setActiveCustomerOrderId(orderId);
              setIsCustomerTrackingModalOpen(true);
            }}
          />
        ) : view === 'find-tiffin' ? (
          <NearbyTiffinServices 
            onNavigate={(hash) => { setView(hash.replace(/^#/, '')); window.location.hash = hash; }} 
            initialFilters={searchFilters} 
            onOpenLogin={(mode) => {
              setLoginModalMode(mode || 'login');
              setIsLoginModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Hero Section */}
            <Hero />

            {/* Hanging Ropes Animation */}
            <HangingRopes />

            {/* Meal Request Form */}
            <MealRequestForm 
              onSubmitRequestSuccess={handleRequestSubmitSuccess}
            />

            {/* Stats Section */}
            <StatsBar />

            {/* Scroll responsive horizontal brand marquee */}
            <ScrollMarquee />

            {/* Top Providers */}
            <TopProviders 
              onExplore={() => { setView('find-tiffin'); window.location.hash = '#find-tiffin'; }} 
              onSelectProvider={handleSelectTopProvider}
            />

            {/* Popular Meal Categories */}
            <Categories onSelectCategory={(cat) => { setSearchFilters({ mealType: cat }); window.location.hash = '#find-tiffin'; }} />

            {/* Value Propositions (Why Choose) */}
            <WhyChoose />

            {/* Verification Steps (Food Safety) */}
            <FoodSafety />

            {/* Story Section */}
            <Story />

            {/* Hanging Spices Animation */}
            <HangingSpices />

            {/* Contact Section */}
            <ContactSection />
          </>
        )}
      </main>
      )}

      {/* Footer (Hidden on Error 500 Server Unreachable & Error 503 Maintenance views) */}
      {(!activeError || (activeError.status !== 500 && activeError.status !== 503)) && (
        <Footer 
          onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)}
          onOpenCookieConsentModal={() => setIsCookieConsentModalOpen(true)}
          onOpenLegalModal={openLegalModal}
        />
      )}

      {/* Interactive Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginModalRole || (loginModalMode === 'signup' ? 'customer' : (view === 'provider' ? 'provider' : (view === 'delivery' ? 'delivery' : 'customer')))}
        initialMode={loginModalMode}
        onOpenBecomeProviderModal={() => { setIsLoginModalOpen(false); setIsBecomeProviderModalOpen(true); }}
        onOpenBecomeDeliveryPartnerModal={() => { setIsLoginModalOpen(false); setIsBecomeDeliveryPartnerModalOpen(true); }}
        onLoginSuccess={handleLoginSuccess}
        onOpenLegalModal={openLegalModal}
      />

      {/* Persistent Customer Cart Drawer */}
      <CartDrawer 
        onProceedToCheckout={() => {
          setView('find-tiffin');
          window.location.hash = '#find-tiffin?checkout=true';
        }}
        onOpenLegalModal={openLegalModal}
      />

      <BecomeProviderModal 
        isOpen={isBecomeProviderModalOpen} 
        onClose={() => setIsBecomeProviderModalOpen(false)}
        onSubmitSuccess={handleBecomeProviderSuccess}
        onOpenLegalModal={openLegalModal}
      />

      <BecomeDeliveryPartnerModal 
        isOpen={isBecomeDeliveryPartnerModalOpen} 
        onClose={() => setIsBecomeDeliveryPartnerModalOpen(false)}
        onSubmitSuccess={handleBecomeDeliveryPartnerSuccess}
        onOpenLegalModal={openLegalModal}
      />

      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)}
      />

      <CookieConsentModal 
        isOpenOverride={isCookieConsentModalOpen}
        onCloseOverride={() => setIsCookieConsentModalOpen(false)}
      />

      {/* Comprehensive Legal, Policies & Agreements Viewer Modal */}
      <ThemedLegalModal 
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialDocId={legalModalDocId}
      />

      <CustomerDeliveryTrackingModal 
        isOpen={isCustomerTrackingModalOpen}
        onClose={() => setIsCustomerTrackingModalOpen(false)}
        initialOrderId={activeCustomerOrderId}
      />

      <RestaurantDeclineModal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        declineData={restaurantDeclineData}
        onFindAlternative={() => {
          setView('find-tiffin');
          window.location.hash = '#find-tiffin';
        }}
        onViewCancelledOrders={() => {
          setView('orders');
          window.location.hash = '#cancelled-orders';
        }}
      />

      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
        currentUser={currentUser}
        onUpdateUser={updateUser}
        onLogout={handleLogout}
        onOpenLegalModal={openLegalModal}
      />

      {/* Toast Alerts */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#1A1A1A] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]">
          <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
