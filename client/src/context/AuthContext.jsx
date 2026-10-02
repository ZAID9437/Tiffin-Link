import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthTokens, clearAuthTokens, saveUserSession, getCookie } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user profile with MongoDB on startup / refresh
  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || getCookie('tiffinlink_token');

      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiRequest('/auth/me');
        const data = typeof res?.json === 'function' ? await res.json() : res;

        if (data && data.success && data.user) {
          if (isMounted) {
            setCurrentUser(data.user);
            saveUserSession(data.user);
          }
        } else {
          // Token is invalid/expired according to backend DB
          clearAuthTokens();
          if (isMounted) setCurrentUser(null);
        }
      } catch (error) {
        console.warn('Network / sync issue on /auth/me, restoring saved user session:', error);
        const savedSessionUser = localStorage.getItem('tiffinlink_user') || localStorage.getItem('user');
        if (savedSessionUser) {
          try {
            const parsed = JSON.parse(savedSessionUser);
            if (isMounted) setCurrentUser(parsed);
          } catch (e) {
            clearAuthTokens();
            if (isMounted) setCurrentUser(null);
          }
        } else {
          clearAuthTokens();
          if (isMounted) setCurrentUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();
    return () => { isMounted = false; };
  }, []);

  const loginUser = (userData, accessToken, refreshToken) => {
    setCurrentUser(userData);
    saveUserSession(userData, accessToken, refreshToken);
  };

  const logoutUser = async () => {
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
    setCurrentUser(updatedUser);
    saveUserSession(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        updateUser,
        loading,
        loginUser,
        logoutUser,
        role: currentUser?.role || 'customer',
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
