import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import "maplibre-gl/dist/maplibre-gl.css"
import { ShieldAlert, RefreshCw, Home, Sparkles } from 'lucide-react'
import ThemedErrorPage from './components/common/ThemedErrorPage'

// Initialize theme from localStorage on startup
(function initTheme() {
  try {
    const savedTheme = localStorage.getItem('tiffinlink_theme') || 'light';
    const root = document.documentElement;
    if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    if (localStorage.getItem('tiffinlink_compact') === 'true') {
      root.classList.add('compact-density');
    }
    if (localStorage.getItem('tiffinlink_reduce_motion') === 'true') {
      root.classList.add('reduce-motion');
    }
    const savedLang = localStorage.getItem('tiffinlink_language');
    if (savedLang) {
      root.lang = savedLang === 'gu_IN' ? 'gu' : savedLang === 'hi_IN' ? 'hi' : 'en';
    }
  } catch (e) {}
})();

// Complete Cross-Platform Protection & Copy-Paste / Selection Restriction Shield
(function setupSiteProtection() {
  if (typeof window === 'undefined') return;

  const preventEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // 1. Disable Right-Click Context Menu & Mobile Hold Callouts
  window.addEventListener('contextmenu', preventEvent, { capture: true });
  document.addEventListener('contextmenu', preventEvent, { capture: true });

  // 2. Disable Copy, Cut, and Paste Globally across the entire website
  window.addEventListener('copy', preventEvent, { capture: true });
  document.addEventListener('copy', preventEvent, { capture: true });

  window.addEventListener('cut', preventEvent, { capture: true });
  document.addEventListener('cut', preventEvent, { capture: true });

  window.addEventListener('paste', preventEvent, { capture: true });
  document.addEventListener('paste', preventEvent, { capture: true });

  // 3. Disable Text Selection Event (selectstart)
  window.addEventListener('selectstart', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });

  document.addEventListener('selectstart', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });

  // 4. Programmatically clear any mouse drag selection ranges on non-input elements
  document.addEventListener('selectionchange', () => {
    try {
      const activeEl = document.activeElement;
      if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA')) {
        const sel = window.getSelection ? window.getSelection() : null;
        if (sel && sel.removeAllRanges && !sel.isCollapsed) {
          sel.removeAllRanges();
        }
      }
    } catch (e) {}
  });

  // 5. Disable Keyboard Shortcuts (DevTools + Copy/Paste/Cut/Select-All)
  const handleKeydown = (e) => {
    const k = (e.key || '').toUpperCase();
    const c = e.keyCode || e.which;
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // F12 or F1 (DevTools Settings)
    if (k === 'F12' || c === 123 || k === 'F1' || c === 112) {
      return preventEvent(e);
    }

    // Ctrl/Cmd + Shift + [I, J, C, K, Z, F, E, S]
    if (isCtrlOrCmd && e.shiftKey) {
      if (['I', 'J', 'C', 'K', 'Z', 'F', 'E', 'S'].includes(k) || [73, 74, 67, 75, 90, 70, 69, 83].includes(c)) {
        return preventEvent(e);
      }
    }

    // macOS Cmd + Option/Alt + [I, J, C, K, Z, F, U]
    if (isCtrlOrCmd && e.altKey) {
      if (['I', 'J', 'C', 'K', 'Z', 'F', 'U'].includes(k) || [73, 74, 67, 75, 90, 70, 85].includes(c)) {
        return preventEvent(e);
      }
    }

    // Ctrl/Cmd + (U = View Source, S = Save Page)
    if (isCtrlOrCmd && !e.shiftKey && !e.altKey) {
      if (['U', 'S'].includes(k) || [85, 83].includes(c)) {
        return preventEvent(e);
      }

      // Restrict Copy (Ctrl/Cmd + C), Paste (Ctrl/Cmd + V), Cut (Ctrl/Cmd + X), Select-All (Ctrl/Cmd + A)
      if (['C', 'V', 'X', 'A'].includes(k) || [67, 86, 88, 65].includes(c)) {
        return preventEvent(e);
      }
    }

    // Windows alternate Copy/Paste (Ctrl+Insert / Shift+Insert)
    if ((e.ctrlKey || e.shiftKey) && (k === 'INSERT' || c === 45)) {
      return preventEvent(e);
    }
  };

  window.addEventListener('keydown', handleKeydown, { capture: true });
  document.addEventListener('keydown', handleKeydown, { capture: true });

  // 6. Prevent dragging non-input content
  window.addEventListener('dragstart', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });
})();

// Global fetch interceptor to automatically attach JWT authorization headers and credentials to API calls
(function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const isApiRequest = url.includes(':5000') || url.startsWith('/api') || url.includes('/api/');

    if (isApiRequest) {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || localStorage.getItem('token');
      const customHeaders = init.headers ? new Headers(init.headers) : (input && input.headers ? new Headers(input.headers) : new Headers());

      if (token && !customHeaders.has('Authorization')) {
        customHeaders.set('Authorization', `Bearer ${token}`);
      }

      const newInit = {
        ...init,
        headers: customHeaders,
        credentials: init.credentials || 'include'
      };

      return originalFetch(input, newInit);
    }

    return originalFetch(input, init);
  };
})();


class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root App Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemedErrorPage 
          status={500}
          customTitle="Unexpected Application Interruption"
          customDescription="A runtime application exception was safely contained. The platform has preserved your session state."
          onNavigateHome={() => {
            this.setState({ hasError: false, error: null });
            window.location.href = '/';
          }}
        />
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
