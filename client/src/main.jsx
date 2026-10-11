import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import "maplibre-gl/dist/maplibre-gl.css"

// Initialize theme from localStorage on startup
(function initTheme() {
  try {
    const savedTheme = localStorage.getItem('tiffinlink_theme');
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
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#F4F7F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '2px solid #FCA5A5',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px auto'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', margin: '0 0 8px 0' }}>
              Application Encountered an Error
            </h2>
            <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              We caught a temporary rendering issue. Click below to reload the app seamlessly.
            </p>
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#991B1B',
              textAlign: 'left',
              marginBottom: '20px',
              wordBreak: 'break-word',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {this.state.error?.toString() || 'React component error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#0A8B5F',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(10, 139, 95, 0.4)'
              }}
            >
              🔄 Reload & Recover Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
