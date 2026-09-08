const BASE_URL = 'http://localhost:5000/api';

const getStoredAccessToken = () => localStorage.getItem('tiffinlink_access_token');
const getStoredRefreshToken = () => localStorage.getItem('tiffinlink_refresh_token');

export const setCookie = (name, value, days = 30) => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.error('Failed to set cookie:', e);
  }
};

export const getCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (!match) return null;
    const decoded = decodeURIComponent(match[2]);
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  } catch (e) {
    return null;
  }
};

export const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const setAuthTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('tiffinlink_access_token', accessToken);
    setCookie('tiffinlink_token', accessToken, 30);
  }
  if (refreshToken) {
    localStorage.setItem('tiffinlink_refresh_token', refreshToken);
  }
};

export const saveUserSession = (userObj, accessToken, refreshToken) => {
  if (userObj) {
    localStorage.setItem('tiffinlink_user', JSON.stringify(userObj));
    if (userObj.role) {
      localStorage.setItem('tiffinlink_user_role', userObj.role);
      setCookie('tiffinlink_role', userObj.role, 30);
    }
    setCookie('tiffinlink_user', userObj, 30);
  }
  if (accessToken) {
    setAuthTokens(accessToken, refreshToken);
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem('tiffinlink_access_token');
  localStorage.removeItem('tiffinlink_refresh_token');
  localStorage.removeItem('tiffinlink_user');
  localStorage.removeItem('tiffinlink_user_role');
  removeCookie('tiffinlink_user');
  removeCookie('tiffinlink_role');
  removeCookie('tiffinlink_token');
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getStoredAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers
  });

  // Automatically attempt token refresh if 401 Unauthorized occurs
  if (response.status === 401 && !options._retry) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      options._retry = true;
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshResponse.json();

        if (refreshData.success && refreshData.accessToken) {
          setAuthTokens(refreshData.accessToken, refreshData.refreshToken);
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          clearAuthTokens();
          window.location.reload();
        }
      } catch (err) {
        clearAuthTokens();
        window.location.reload();
      }
    }
  }

  // Safely parse JSON payload and attach fields to response so callers get both Response methods and parsed JSON object fields
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonBody = await response.clone().json();
      if (jsonBody && typeof jsonBody === 'object') {
        Object.assign(response, jsonBody);
      }
    }
  } catch (err) {
    // Ignore JSON parsing errors for non-JSON responses
  }

  return response;
};
