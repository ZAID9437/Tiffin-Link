import React, { useState, useEffect } from 'react';
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

// Shared Animations & Modals
import Preloader from './components/Preloader';
import ParticleBackground from './components/ParticleBackground';
import ScrollMarquee from './components/ScrollMarquee';
import ScrollRopeIndicator from './components/ScrollRopeIndicator';
import LoginModal from './components/LoginModal';
import DemoModal from './components/DemoModal';

import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tiffinlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser?.email) {
      fetch(`http://localhost:5000/api/auth/me?email=${encodeURIComponent(currentUser.email)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('tiffinlink_user', JSON.stringify(data.user));
          }
        })
        .catch(err => console.error('Failed to sync profile from MongoDB:', err));
    }
  }, []);

  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem('tiffinlink_user', JSON.stringify(userObj));
    showToastNotification(`Welcome back, ${userObj.name || userObj.email}! Signed in successfully.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tiffinlink_user');
    showToastNotification('You have been signed out.');
  };

  // Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBecomeProviderModalOpen, setIsBecomeProviderModalOpen] = useState(false);
  const [isBecomeDeliveryPartnerModalOpen, setIsBecomeDeliveryPartnerModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [preloaderFinished, setPreloaderFinished] = useState(false);

  // Simple state-based router using window.location.hash
  const [view, setView] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#provider') return 'provider';
    if (hash === '#delivery') return 'delivery';
    return 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const currentView = hash === '#provider' ? 'provider' : hash === '#delivery' ? 'delivery' : 'home';
      setView(currentView);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    const handleKeyDown = (e) => {
      const isInput = e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea';

      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+U
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+C, Ctrl+X, Ctrl+V outside input fields
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) {
        if (!isInput) {
          e.preventDefault();
          return false;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const handleCopy = (e) => {
      const isInput = e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea';
      if (!isInput) {
        e.preventDefault();
      }
    };
    const handleCut = (e) => {
      const isInput = e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea';
      if (!isInput) {
        e.preventDefault();
      }
    };
    const handlePaste = (e) => {
      const isInput = e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea';
      if (!isInput) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Toast Notification state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToastNotification = (message, type = 'success') => {
    setToast({
      show: true,
      message,
      type
    });

    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleRequestSubmitSuccess = () => {
    showToastNotification('Meal Request submitted successfully! Checking local home-chefs...');
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
    scrollElements.forEach(el => observer.observe(el));

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
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mousemove', handleMagneticMove);
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      scrollElements.forEach(el => observer.unobserve(el));
      textRevealElements.forEach(el => observer.unobserve(el));
    };
  }, [view]);

  // If user is authenticated as a Provider, render the Provider Kitchen Portal Dashboard directly
  if (currentUser?.role === 'provider') {
    return (
      <div className="app-layout">
        <ProviderDashboard currentUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  // If user is authenticated as a Delivery Partner, render the Delivery Dashboard directly
  if (currentUser?.role === 'delivery') {
    return (
      <div className="app-layout">
        <DeliveryDashboard currentUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Premium Entrance Preloader */}
      <Preloader key={view} onComplete={handlePreloaderComplete} />

      {/* Floating Spice Canvas Background */}
      <ParticleBackground />

      {/* Hanging Vertical Scroll Indicator Rope */}
      <ScrollRopeIndicator view={view} />

      {/* Navigation */}
      <Navbar 
        onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)} 
        onOpenBecomeDeliveryPartnerModal={() => setIsBecomeDeliveryPartnerModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
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
            <TopProviders />

            {/* Popular Meal Categories */}
            <Categories />

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
      />

      {/* Interactive Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={view === 'provider' ? 'provider' : (view === 'delivery' ? 'delivery' : 'customer')}
        onOpenBecomeProviderModal={() => setIsBecomeProviderModalOpen(true)}
        onOpenBecomeDeliveryPartnerModal={() => setIsBecomeDeliveryPartnerModalOpen(true)}
        onLoginSuccess={handleLoginSuccess}
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

      {/* Toast Alerts */}
      <div className={`toast toast-success ${toast.show ? 'show' : ''}`}>
        <CheckCircle2 className="text-emerald" size={20} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
