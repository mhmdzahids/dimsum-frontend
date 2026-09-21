/**
 * Centralized API Client - Makan Dimsum Indonesia
 * 
 * STANDARD DATA ENVELOPE:
 * Backend response format: { success: boolean, data?: any, message?: string, error?: string, errors?: string[] }
 * 
 * Standardized Client Return Value:
 * - res.success: boolean
 * - res.data: Payload data extracted directly from body.data (if present) or body itself.
 *             Callers can reliably access `res.data` directly without needing `res.data.data`.
 * - res.message: String notification/message from server (or null)
 * - res.error: Error message string (from body.error, body.message, or network fallback)
 * - res.errors: Array of validation errors (or null)
 * - res.status: HTTP status code (or 0 for network, 408 for timeout)
 * - res.raw: The raw response body object for edge cases
 * - res.isAborted / res.isTimeout: Booleans for cancellation handling
 */

const RAW_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || '';
// Strip trailing slash from base if present
const API_BASE = RAW_BASE.replace(/\/+$/, '');

// Excluded auth endpoints where 401 means invalid credentials, NOT an expired session
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google'
];

let isLoggingOut = false;

/**
 * Normalizes endpoint URL safely without creating duplicate /api/api prefixes
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
 * Resolves authorization token based on explicit options or default context
 */
export function resolveAuthToken(endpoint, authOption) {
  if (authOption === false || authOption === 'none') {
    return null;
  }

  // Explicit admin
  if (authOption === 'admin') {
    try { return localStorage.getItem('adminToken') || null; } catch { return null; }
  }

  // Explicit customer
  if (authOption === 'customer') {
    try { return localStorage.getItem('dimsum_customer_token') || null; } catch { return null; }
  }

  // Fallback default: if endpoint is strictly an admin/inventory route or browsing admin panel, use adminToken
  const isAdminPath = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');
  if (endpoint.startsWith('/api/admin') || endpoint.startsWith('/admin') || endpoint.startsWith('/api/inventory') || isAdminPath) {
    try {
      const adminTok = localStorage.getItem('adminToken');
      if (adminTok) return adminTok;
    } catch { /* ignore */ }
  }

  // Default to customer token if present in localStorage
  try {
    return localStorage.getItem('dimsum_customer_token') || null;
  } catch {
    return null;
  }
}

/**
 * Handles HTTP 401 Unauthorized securely with deduplication and credential endpoint exclusion
 */
function handle401Unauthorized(endpoint, token, authType) {
  // 1. Never trigger logout if request did not carry a token
  if (!token) return;

  // 2. Never trigger logout on login/register endpoints (wrong password != expired token)
  const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => endpoint.endsWith(ep) || endpoint.includes(ep));
  if (isAuthEndpoint) return;

  // 3. Deduplicate parallel 401 events so only one logout event fires
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    const isCustomer = authType === 'customer' || token === localStorage.getItem('dimsum_customer_token');
    const isAdmin = authType === 'admin' || token === localStorage.getItem('adminToken');

    if (isCustomer) {
      localStorage.removeItem('dimsum_customer_token');
      localStorage.removeItem('dimsum_customer_user');
      window.dispatchEvent(new CustomEvent('dimsum_customer_auth_changed', { detail: { loggedIn: false } }));
    }

    if (isAdmin) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new CustomEvent('dimsum_admin_auth_expired'));
    }
  } catch (err) {
    console.error('Error handling 401 logout:', err);
  } finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 1500);
  }
}

// Reset logout lock when customer logs in again
if (typeof window !== 'undefined') {
  window.addEventListener('dimsum_customer_auth_changed', (e) => {
    if (e.detail?.loggedIn) {
      isLoggingOut = false;
    }
  });
}

export function resetAuthLock() {
  isLoggingOut = false;
}

export const _resetLoggingOutLock = resetAuthLock;

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Core request handler
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    auth, // 'customer' | 'admin' | false | undefined
    signal: userSignal,
    timeout = DEFAULT_TIMEOUT_MS,
    ...customConfig
  } = options;

  const url = resolveUrl(endpoint);
  const token = resolveAuthToken(endpoint, auth);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const reqHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && !headers.Authorization && !headers.authorization ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let configBody;
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    configBody = isFormData ? body : typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Setup abort controller for timeout & external cancellation
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

    // Secure 401 handling
    if (status === 401) {
      handle401Unauthorized(endpoint, token, auth);
    }

    // Safely parse JSON, 204 No Content, or non-JSON HTML error pages
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
      // Handle HTML error pages (e.g. 502/504 from Nginx/cPanel)
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
        error: responseData?.error || responseData?.message || `Permintaan gagal (${status})`,
        errors: responseData?.errors || null,
        data: responseData?.data || null,
        status,
        raw: responseData,
      };
    }

    if (response.ok) {
      const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => endpoint.endsWith(ep) || endpoint.includes(ep));
      if (isAuthEndpoint) {
        isLoggingOut = false;
      }
    }

    // Standardized data extraction:
    // res.data gives the actual payload (either responseData.data or responseData itself)
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
        error: isTimeout ? 'Permintaan melebihi batas waktu (timeout). Silakan coba lagi.' : 'Permintaan dibatalkan.',
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
      error: error.message || 'Koneksi terputus. Silakan periksa jaringan internet Anda.',
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
  resetAuthLock,
  request,
};

export default api;
