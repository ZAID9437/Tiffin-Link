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
    localStorage.setItem('tiffinlink_token', accessToken);
    localStorage.setItem('token', accessToken);
    setCookie('tiffinlink_token', accessToken, 30);
  }
  if (refreshToken) {
    localStorage.setItem('tiffinlink_refresh_token', refreshToken);
  }
};

export const saveUserSession = (userObj, accessToken, refreshToken) => {
  if (userObj) {
    localStorage.setItem('tiffinlink_user', JSON.stringify(userObj));
    localStorage.setItem('user', JSON.stringify(userObj));
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
  localStorage.removeItem('tiffinlink_token');
  localStorage.removeItem('token');
  localStorage.removeItem('tiffinlink_refresh_token');
  localStorage.removeItem('tiffinlink_user');
  localStorage.removeItem('user');
  localStorage.removeItem('tiffinlink_user_role');
  removeCookie('tiffinlink_user');
  removeCookie('tiffinlink_role');
  removeCookie('tiffinlink_token');
};

export const cleanErrorMessage = (msg, fallback = 'Connection interrupted. Please check your internet connection and try again.') => {
  if (!msg || typeof msg !== 'string') return fallback;

  const lower = msg.toLowerCase();

  // Check for database, mongo, internal backend, or server errors
  const hasDbOrBackendLeak =
    lower.includes('mongo') ||
    lower.includes('e11000') ||
    lower.includes('duplicate key') ||
    lower.includes('cast to objectid') ||
    lower.includes('casterror') ||
    lower.includes('validation failed') ||
    lower.includes('bson') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('database') ||
    lower.includes('replica') ||
    lower.includes('collection') ||
    lower.includes('topology') ||
    lower.includes('buffering timed out') ||
    lower.includes('timed out') ||
    lower.includes('index:') ||
    lower.includes('syntaxerror') ||
    lower.includes('typeerror') ||
    lower.includes('referenceerror') ||
    lower.includes('server error') ||
    lower.includes('internal server error') ||
    lower.includes('backend') ||
    lower.includes('sync');

  if (hasDbOrBackendLeak) {
    if (lower.includes('e11000') || lower.includes('duplicate key')) {
      return 'A record with these details already exists. Please verify your information.';
    }
    if (lower.includes('cast to objectid') || lower.includes('casterror')) {
      return 'The requested record could not be found.';
    }
    if (lower.includes('validation')) {
      return 'Please make sure all required fields are filled out correctly.';
    }
    return 'Connection interrupted. Please check your internet connection and try again.';
  }

  return msg;
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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (fetchErr) {
    console.warn('Network request error in apiRequest:', fetchErr);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tiffinlink:network-offline', { detail: { endpoint, error: fetchErr } }));
      window.dispatchEvent(new CustomEvent('tiffinlink:app-error', { 
        detail: { 
          status: 500, 
          title: 'Server Is Currently Unreachable',
          message: 'Our culinary kitchen servers are currently not responding. Our engineering team is actively attending to this.',
          error: fetchErr 
        } 
      }));
    }
    return {
      success: false,
      ok: false,
      status: 0,
      code: 'OFFLINE_OR_NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection.'
    };
  }

  // Dispatch genuine server runtime errors
  if (response.status === 503) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tiffinlink:app-error', {
        detail: {
          status: 503,
          errorId: response.headers?.get('x-error-id'),
          title: 'TiffinLink Is Under Maintenance',
          message: 'We are currently performing routine upgrades to our meal routing and dispatch engine.'
        }
      }));
    }
  } else if (response.status === 500) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tiffinlink:app-error', {
        detail: {
          status: 500,
          errorId: response.headers?.get('x-error-id'),
          title: 'Server Is Currently Unreachable',
          message: 'Our culinary kitchen servers are currently not responding. Our engineering team is actively attending to this.'
        }
      }));
    }
  } else if (response.status === 403) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tiffinlink:app-error', {
        detail: {
          status: 403,
          errorId: response.headers?.get('x-error-id')
        }
      }));
    }
  }

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
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tiffinlink:session-expired', { detail: { endpoint } }));
            window.dispatchEvent(new CustomEvent('tiffinlink:app-error', { detail: { status: 401 } }));
          }
        }
      } catch (err) {
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tiffinlink:session-expired', { detail: { endpoint } }));
          window.dispatchEvent(new CustomEvent('tiffinlink:app-error', { detail: { status: 401 } }));
        }
      }
    } else {
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tiffinlink:session-expired', { detail: { endpoint } }));
        window.dispatchEvent(new CustomEvent('tiffinlink:app-error', { detail: { status: 401 } }));
      }
    }
  }

  try {
    const errorId = response.headers.get('x-error-id');
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonBody = await response.json();
      if (jsonBody && typeof jsonBody === 'object') {
        if (typeof jsonBody.message === 'string') {
          jsonBody.message = cleanErrorMessage(jsonBody.message);
        }
        if (typeof jsonBody.error === 'string') {
          jsonBody.error = cleanErrorMessage(jsonBody.error);
        }
        if (errorId && !jsonBody.errorId) {
          jsonBody.errorId = errorId;
        }
        return {
          ...jsonBody,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          errorId: jsonBody.errorId || errorId,
          json: async () => jsonBody
        };
      }
      return jsonBody;
    }
  } catch (err) {
    console.warn('JSON parsing error in apiRequest:', err);
  }

  return response;
};

export const triggerAppError = (detail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tiffinlink:app-error', { detail }));
  }
};

export const clearAppError = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tiffinlink:clear-app-error'));
  }
};
