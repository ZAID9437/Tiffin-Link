import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthTokens, clearAuthTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tiffinlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync profile with MongoDB on mount
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('tiffinlink_access_token');
      if (token || currentUser?.email) {
        try {
          const res = await apiRequest('/auth/me');
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('tiffinlink_user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Failed to sync current user profile:', error);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const loginUser = (userData, accessToken, refreshToken) => {
    setCurrentUser(userData);
    localStorage.setItem('tiffinlink_user', JSON.stringify(userData));
    if (accessToken) setAuthTokens(accessToken, refreshToken);
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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
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
