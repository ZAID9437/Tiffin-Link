import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setAuthTokens, clearAuthTokens, saveUserSession, getCookie } from '../services/api';

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u) return null;
  const uid = String(u._id || u.id || '');
  return {
    ...u,
    id: uid,
    _id: uid
  };
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tiffinlink_user') || localStorage.getItem('user');
      if (stored) {
        return normalizeUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading stored user session:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user profile with MongoDB /auth/me
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || getCookie('tiffinlink_token');

    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await apiRequest('/auth/me');
      const data = typeof res?.json === 'function' ? await res.json() : res;

      if (data && data.success && data.user) {
        const normalized = normalizeUser(data.user);
        setCurrentUser(normalized);
        saveUserSession(normalized);
        return normalized;
      } else {
        // Token is invalid/expired according to backend DB
        clearAuthTokens();
        setCurrentUser(null);
        return null;
      }
    } catch (error) {
      console.warn('Network / sync issue on /auth/me, fallback to stored session:', error);
      const savedSessionUser = localStorage.getItem('tiffinlink_user') || localStorage.getItem('user');
      if (savedSessionUser) {
        try {
          const parsed = normalizeUser(JSON.parse(savedSessionUser));
          setCurrentUser(parsed);
          return parsed;
        } catch (e) {
          clearAuthTokens();
          setCurrentUser(null);
          return null;
        }
      } else {
        clearAuthTokens();
        setCurrentUser(null);
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Sync session across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'tiffinlink_access_token' || e.key === 'tiffinlink_user' || e.key === null) {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  // Centralized login action
  const login = async (userData, accessToken, refreshToken) => {
    if (accessToken) {
      setAuthTokens(accessToken, refreshToken);
    }
    const normalized = normalizeUser(userData);
    if (normalized) {
      setCurrentUser(normalized);
      saveUserSession(normalized, accessToken, refreshToken);
    }
    // Perform backend sync to retrieve authoritative DB record
    try {
      const fresh = await refreshUser();
      return fresh || normalized;
    } catch (e) {
      return normalized;
    }
  };

  // Centralized logout action
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('tiffinlink_refresh_token');
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCurrentUser(null);
      clearAuthTokens();
      if (window.location.hash) {
        window.location.hash = '';
      }
    }
  };

  const updateUser = (updatedUser) => {
    const normalized = normalizeUser(updatedUser);
    setCurrentUser(normalized);
    if (normalized) saveUserSession(normalized);
  };

  const isAuthenticated = !loading && !!(currentUser && (currentUser._id || currentUser.id));

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        setCurrentUser,
        updateUser,
        loading,
        login,
        loginUser: login,
        logout,
        logoutUser: logout,
        refreshUser,
        role: currentUser?.role || 'customer',
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
