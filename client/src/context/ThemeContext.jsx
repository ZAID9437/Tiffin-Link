import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  isDark: false,
  compactMode: false,
  reduceMotion: false,
  setTheme: () => {},
  setCompactMode: () => {},
  setReduceMotion: () => {}
});

export function ThemeProvider({ children }) {
  // Read initial stored theme preference ('light' | 'dark' | 'system')
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('tiffinlink_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [compactMode, setCompactModeState] = useState(() => {
    try {
      return localStorage.getItem('tiffinlink_compact') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [reduceMotion, setReduceMotionState] = useState(() => {
    try {
      return localStorage.getItem('tiffinlink_reduce_motion') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Calculate resolved OS system theme
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Real-time listener for OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  // Apply dark mode classes and attributes to <html> and <body>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
      }
    }
  }, [isDark]);

  // Apply compact mode class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (compactMode) {
      root.classList.add('compact-density');
    } else {
      root.classList.remove('compact-density');
    }
  }, [compactMode]);

  // Apply reduce motion class
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'tiffinlink_theme' && e.newValue) {
        setThemeState(e.newValue);
      }
      if (e.key === 'tiffinlink_compact') {
        setCompactModeState(e.newValue === 'true');
      }
      if (e.key === 'tiffinlink_reduce_motion') {
        setReduceMotionState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('tiffinlink_theme', newTheme);
      window.dispatchEvent(new CustomEvent('tiffinlink_theme_change', { detail: newTheme }));
    } catch (e) {}
  }, []);

  const setCompactMode = useCallback((val) => {
    setCompactModeState(val);
    try {
      localStorage.setItem('tiffinlink_compact', String(val));
    } catch (e) {}
  }, []);

  const setReduceMotion = useCallback((val) => {
    setReduceMotionState(val);
    try {
      localStorage.setItem('tiffinlink_reduce_motion', String(val));
    } catch (e) {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        compactMode,
        reduceMotion,
        setTheme,
        setCompactMode,
        setReduceMotion
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
