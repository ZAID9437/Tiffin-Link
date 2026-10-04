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
import CartDrawer from './components/CartDrawer';

import { useAuth } from './context/AuthContext';
import { clearAuthTokens, getCookie, setCookie, saveUserSession } from './services/api';
import { CheckCircle2 } from 'lucide-react';

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
  const [isCustomerTrackingModalOpen, setIsCustomerTrackingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState('');
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  const [searchFilters, setSearchFilters] = useState({});

  const openLoginModal = useCallback((mode = 'login', role = 'customer') => {
    setLoginModalMode(mode);
    setLoginModalRole(role);
    setIsLoginModalOpen(true);
  }, []);

  // Centralized Route Resolution & Route Protection Guard (Requirement 1, 5 & 6)
  const resolveRoute = useCallback((hash, user) => {
    const rawRole = (user?.role || '').toLowerCase();
    const cleanHash = (hash || (typeof window !== 'undefined' ? window.location.hash : '') || '').toLowerCase();

    // 1. BEFORE LOGIN (Logged Out State - Requirement 1)
    if (!user) {
      // Guard Protected URLs: Directly entering protected URLs must NOT expose private panels
      if (cleanHash.startsWith('#/admin') || cleanHash.startsWith('#admin')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);
        openLoginModal('login', 'admin');
        showToastNotification('Administrator authentication required to access Super Admin dashboard.');
        return 'home';
      }
      if (
        cleanHash.startsWith('#/provider') || 
        cleanHash.startsWith('#provider') || 
        cleanHash.startsWith('#my-tiffins') || 
        cleanHash.startsWith('#provider-orders') || 
        cleanHash.startsWith('#provider-earnings')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#for-providers');
        openLoginModal('login', 'provider');
        showToastNotification('Please log in to your provider account to access the Provider Dashboard.');
        return 'provider'; // Renders ProviderLanding (public)
      }
      if (
        cleanHash.startsWith('#/delivery') || 
        cleanHash.startsWith('#delivery') || 
        cleanHash.startsWith('#my-deliveries') || 
        cleanHash.startsWith('#delivery-earnings')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#for-deliverers');
        openLoginModal('login', 'delivery');
        showToastNotification('Please log in to your delivery partner account to access the Delivery Dashboard.');
        return 'delivery'; // Renders DeliveryLanding (public)
      }
      if (
        cleanHash.startsWith('#orders') || 
        cleanHash.startsWith('#my-orders') || 
        cleanHash.startsWith('#active-orders') || 
        cleanHash.startsWith('#track-order') || 
        cleanHash.startsWith('#upcoming-tiffins') || 
        cleanHash.startsWith('#order-history') || 
        cleanHash.startsWith('#cancelled-orders')
      ) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
        openLoginModal('login', 'customer');
        showToastNotification('Please log in to view your orders and dispatch tracker.');
        return 'find-tiffin';
      }

      // Allowed Public Routes
      if (cleanHash.startsWith('#for-providers') || cleanHash.startsWith('#provider-landing')) return 'provider';
      if (cleanHash.startsWith('#for-deliverers') || cleanHash.startsWith('#delivery-landing')) return 'delivery';
      if (cleanHash.startsWith('#find-tiffin') || cleanHash.startsWith('#order-tiffin') || cleanHash.startsWith('#for-diners')) return 'find-tiffin';
      return 'home';
    }

    // 2. ADMIN ROLE (Requirement 3 & 5)
    if (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'super_admin') {
      return 'admin';
    }

    // 3. PROVIDER ROLE (Requirement 3 & 5)
    if (rawRole === 'provider') {
      if (cleanHash.startsWith('#/admin') || cleanHash.startsWith('#admin') || cleanHash.startsWith('#delivery') || cleanHash.startsWith('#orders')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#provider');
        showToastNotification('Access restricted: Your account is authorized as a Kitchen Provider.');
      }
      return 'provider';
    }

    // 4. DELIVERY PARTNER / DRIVER ROLE (Requirement 3 & 5)
    if (rawRole === 'delivery' || rawRole === 'driver' || rawRole === 'deliverer' || rawRole === 'delivery_partner') {
      if (cleanHash.startsWith('#/admin') || cleanHash.startsWith('#admin') || cleanHash.startsWith('#provider') || cleanHash.startsWith('#orders')) {
        if (typeof window !== 'undefined') window.history.replaceState(null, '', '#delivery');
        showToastNotification('Access restricted: Your account is authorized as a Delivery Partner.');
      }
      return 'delivery';
    }

    // 5. CUSTOMER / DINER ROLE (Requirement 3 & 5)
    if (cleanHash.startsWith('#/admin') || cleanHash.startsWith('#admin')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Administrator privileges required.');
      return 'find-tiffin';
    }
    if (cleanHash.startsWith('#/provider') || cleanHash.startsWith('#provider')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Kitchen Provider account required.');
      return 'find-tiffin';
    }
    if (cleanHash.startsWith('#/delivery') || cleanHash.startsWith('#delivery')) {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '#find-tiffin');
      showToastNotification('Access denied: Delivery Partner account required.');
      return 'find-tiffin';
    }

    if (
      cleanHash.startsWith('#orders') || 
      cleanHash.startsWith('#my-orders') || 
      cleanHash.startsWith('#active-orders') || 
      cleanHash.startsWith('#track-order') || 
      cleanHash.startsWith('#upcoming-tiffins') || 
      cleanHash.startsWith('#order-history') || 
      cleanHash.startsWith('#cancelled-orders')
    ) {
      return 'orders';
    }

    if (cleanHash.startsWith('#find-tiffin') || cleanHash.startsWith('#order-tiffin') || cleanHash.startsWith('#for-diners')) {
      return 'find-tiffin';
    }

    return 'home';
  }, [openLoginModal, showToastNotification]);

  // State-based router with security enforcement
  const [view, setView] = useState(() => resolveRoute(typeof window !== 'undefined' ? window.location.hash : '', currentUser));

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
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, authLoading, resolveRoute]);

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


  // Sync active order for logged-in Diner/Customer from MongoDB
  useEffect(() => {
    if (!currentUser || currentUser.role === 'provider' || currentUser.role === 'delivery') {
      setHasActiveOrder(false);
      setActiveCustomerOrderId('');
      return;
    }

    const checkActiveOrder = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/delivery/requests');
        const json = await res.json();
        if (json.success && Array.isArray(json.requests)) {
          const userPhone = currentUser.phone ? currentUser.phone.replace(/[^\d]/g, '') : '';
          const userEmail = (currentUser.email || '').toLowerCase();
          const userName = (currentUser.name || '').toLowerCase();

          const activeRequest = json.requests.find(r => {
            const reqPhone = r.customerPhone ? r.customerPhone.replace(/[^\d]/g, '') : '';
            const reqEmail = (r.customerEmail || r.providerEmail || '').toLowerCase();
            const reqName = (r.customerName || '').toLowerCase();

            const isMatch = (userPhone && reqPhone && reqPhone.endsWith(userPhone.slice(-8))) ||
                            (userEmail && reqEmail === userEmail) ||
                            (userName && reqName.includes(userName));

            const isActiveStatus = !['Delivered', 'Cancelled', 'Failed'].includes(r.status);
            return isMatch && isActiveStatus;
          });

          if (activeRequest) {
            setHasActiveOrder(true);
            setActiveCustomerOrderId(activeRequest.requestId || activeRequest.orderId || activeRequest._id);
          } else {
            const sessionPlaced = localStorage.getItem('tiffinlink_recent_order');
            if (sessionPlaced) {
              setHasActiveOrder(true);
              setActiveCustomerOrderId(sessionPlaced);
            } else {
              setHasActiveOrder(false);
            }
          }
        }
      } catch (err) {
        console.error('Error checking active customer orders:', err);
      }
    };

    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);



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

    // 1. Spring-Physics Custom Cursor
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    const cursorText = document.getElementById('cursor-text');

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
  }, [view]);



  // Only authenticated Super Admin can access Admin Dashboard Control Center
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'super_admin')) {
    return (
      <div className="app-layout">
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
    return (
      <div className="app-layout">
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
    return (
      <div className="app-layout">
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
          openLoginModal(mode || 'login', role || 'customer');
        }}
        onOpenTrackingModal={() => setIsCustomerTrackingModalOpen(true)}
        onOpenProfileModal={(tab) => {
          setProfileModalTab(tab || 'profile');
          setIsProfileModalOpen(true);
        }}
        hasActiveOrder={hasActiveOrder}
        currentView={view}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Sections */}
      <main>
        {view === 'provider' ? (
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

      {/* Footer */}
      <Footer 
        onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)}
        onOpenCookieConsentModal={() => setIsCookieConsentModalOpen(true)}
      />

      {/* Interactive Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginModalRole || (view === 'provider' ? 'provider' : (view === 'delivery' ? 'delivery' : 'customer'))}
        initialMode={loginModalMode}
        onOpenBecomeProviderModal={() => { setIsLoginModalOpen(false); setIsBecomeProviderModalOpen(true); }}
        onOpenBecomeDeliveryPartnerModal={() => { setIsLoginModalOpen(false); setIsBecomeDeliveryPartnerModalOpen(true); }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Persistent Customer Cart Drawer */}
      <CartDrawer 
        onProceedToCheckout={() => {
          setView('find-tiffin');
          window.location.hash = '#find-tiffin?checkout=true';
        }}
      />

      <BecomeProviderModal 
        isOpen={isBecomeProviderModalOpen} 
        onClose={() => setIsBecomeProviderModalOpen(false)}
        onSubmitSuccess={handleBecomeProviderSuccess}
      />

      <BecomeDeliveryPartnerModal 
        isOpen={isBecomeDeliveryPartnerModalOpen} 
        onClose={() => setIsBecomeDeliveryPartnerModalOpen(false)}
        onSubmitSuccess={handleBecomeDeliveryPartnerSuccess}
      />

      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)}
      />

      <CookieConsentModal 
        isOpenOverride={isCookieConsentModalOpen}
        onCloseOverride={() => setIsCookieConsentModalOpen(false)}
      />

      <CustomerDeliveryTrackingModal 
        isOpen={isCustomerTrackingModalOpen}
        onClose={() => setIsCustomerTrackingModalOpen(false)}
        initialOrderId={activeCustomerOrderId}
      />

      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
        currentUser={currentUser}
        onUpdateUser={updateUser}
        onLogout={handleLogout}
      />

      {/* Toast Alerts */}
      <div className={`toast toast-success ${toast.show ? 'show' : ''}`}>
        <CheckCircle2 className="text-emerald" size={20} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
