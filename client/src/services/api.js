const BASE_URL = 'http://localhost:5000/api';

const getStoredAccessToken = () => localStorage.getItem('tiffinlink_access_token');
const getStoredRefreshToken = () => localStorage.getItem('tiffinlink_refresh_token');

export const setAuthTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('tiffinlink_access_token', accessToken);
  if (refreshToken) localStorage.setItem('tiffinlink_refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('tiffinlink_access_token');
  localStorage.removeItem('tiffinlink_refresh_token');
  localStorage.removeItem('tiffinlink_user');
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
