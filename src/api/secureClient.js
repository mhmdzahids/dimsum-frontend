/**
 * Enhanced API Client with React Query & Security
 * 
 * Improvements over original client.js:
 * - Automatic token refresh on 401
 * - Integration with Zustand auth store
 * - Better error handling
 * - Request/response interceptors
 */

import { useAuthStore, useCustomerAuthStore } from '../stores/authStore';

const RAW_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || '';
const API_BASE = RAW_BASE.replace(/\/+$/, '');

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google'
];

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Refresh admin token
 */
async function refreshAdminToken() {
  try {
    const res = await request('/api/auth/refresh', {
      method: 'POST',
      auth: 'admin',
    });
    
    if (res.success && res.data?.token) {
      const newToken = res.data.token;
      useAuthStore.getState().setAuth(newToken, useAuthStore.getState().adminUser, useAuthStore.getState().adminRole);
      return newToken;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
    useAuthStore.getState().clearAuth();
  }
  return null;
}

/**
 * Normalize endpoint URL safely
 */
export function resolveUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const baseHasApi = API_BASE.endsWith('/api');
  const endpointHasApi = clean.startsWith('/api/') || clean === '/api';
  const endpointHasStatic = clean.startsWith('/static/') || clean === '/static';

  if (endpointHasApi || endpointHasStatic) {
    const prefix = baseHasApi && endpointHasApi ? API_BASE.slice(0, -4) : API_BASE;
    return `${prefix}${clean}`;
  }

  const apiPrefix = baseHasApi ? API_BASE : `${API_BASE}/api`;
  return `${apiPrefix}${clean}`;
}

/**
 * Resolve auth token from stores or localStorage
 */
export function resolveAuthToken(endpoint, authOption) {
  if (authOption === false || authOption === 'none') {
    return null;
  }

  // Explicit admin
  if (authOption === 'admin') {
    try {
      const token = useAuthStore.getState().adminToken;
      if (token) return token;
      return localStorage.getItem('adminToken') || null;
    } catch {
      return null;
    }
  }

  // Explicit customer
  if (authOption === 'customer') {
    try {
      const token = useCustomerAuthStore.getState().customerToken;
      if (token) return token;
      return localStorage.getItem('dimsum_customer_token') || null;
    } catch {
      return null;
    }
  }

  // Fallback: detect from route and use appropriate token
  const isAdminPath = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');
  if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/admin') || endpoint.startsWith('/api/inventory') || isAdminPath) {
    try {
      const token = useAuthStore.getState().adminToken;
      if (token) return token;
      const adminTok = localStorage.getItem('adminToken');
      if (adminTok) return adminTok;
    } catch { /* ignore */ }
  }

  // Default to customer token
  try {
    const token = useCustomerAuthStore.getState().customerToken;
    if (token) return token;
    return localStorage.getItem('dimsum_customer_token') || null;
  } catch {
    return null;
  }
}

/**
 * Handle 401 with automatic retry using token refresh
 */
async function handle401WithRefresh(endpoint, authType, originalConfig) {
  const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => endpoint.endsWith(ep) || endpoint.includes(ep));
  
  // Never retry on auth endpoints
  if (isAuthEndpoint) {
    return null;
  }

  // Only refresh for admin requests
  if (authType !== 'admin') {
    return null;
  }

  if (isRefreshing) {
    // Wait for refresh to complete, then retry
    return new Promise((resolve) => {
      addRefreshSubscriber((newToken) => {
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        resolve(request(endpoint, originalConfig));
      });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAdminToken();
    isRefreshing = false;

    if (newToken) {
      onRefreshed(newToken);
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      return request(endpoint, originalConfig);
    }
  } catch (err) {
    isRefreshing = false;
    useAuthStore.getState().clearAuth();
  }

  return null;
}

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Core request handler with retry logic
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    auth,
    signal: userSignal,
    timeout = DEFAULT_TIMEOUT_MS,
    ...customConfig
  } = options;

  const url = resolveUrl(endpoint);
  const token = resolveAuthToken(endpoint, auth);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const reqHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let configBody;
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    configBody = isFormData ? body : typeof body === 'string' ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  let timeoutId = null;

  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Request timeout', 'TimeoutError'));
    }, timeout);
  }

  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort(userSignal.reason);
    } else {
      userSignal.addEventListener('abort', () => controller.abort(userSignal.reason), { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: reqHeaders,
      signal: controller.signal,
      ...customConfig,
      ...(configBody !== undefined ? { body: configBody } : {})
    });

    const status = response.status;

    // Handle 401 with automatic refresh
    if (status === 401) {
      const refreshed = await handle401WithRefresh(endpoint, auth, { method, headers: reqHeaders, body: configBody, ...customConfig });
      if (refreshed) {
        return refreshed;
      }
    }

    // Parse response
    let responseData = null;
    const contentType = response.headers.get('content-type') || '';

    if (status === 204) {
      responseData = null;
    } else if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          const cleanSnippet = text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 150);
          responseData = {
            error: cleanSnippet ? `Server Error (${status}): ${cleanSnippet}` : `Server returned status ${status}`
          };
        }
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: responseData?.error || responseData?.message || `Request failed (${status})`,
        errors: responseData?.errors || null,
        data: responseData?.data || null,
        status,
        raw: responseData,
      };
    }

    const extractedData = responseData && typeof responseData === 'object' && 'data' in responseData
      ? responseData.data
      : responseData;

    return {
      success: responseData?.success !== undefined ? responseData.success : true,
      data: extractedData,
      message: responseData?.message || null,
      status,
      raw: responseData,
    };
  } catch (error) {
    const isUserAbort = Boolean(userSignal?.aborted);
    const isTimeout = !isUserAbort && (controller.signal.aborted && (error.name === 'TimeoutError' || controller.signal.reason?.name === 'TimeoutError'));
    const isAborted = isUserAbort || controller.signal.aborted;

    if (isAborted) {
      return {
        success: false,
        error: isTimeout ? 'Request timeout. Please try again.' : 'Request cancelled.',
        data: null,
        status: isTimeout ? 408 : 0,
        isAborted: true,
        isUserAbort,
        isTimeout,
      };
    }

    console.error(`API Error [${method} ${url}]:`, error);
    return {
      success: false,
      error: error.message || 'Connection failed. Please check your network.',
      data: null,
      status: 0,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
  upload: (url, formData, options = {}) => request(url, { ...options, method: 'POST', body: formData }),
  request,
};

export default api;
