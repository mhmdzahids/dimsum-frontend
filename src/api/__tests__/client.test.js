import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { resolveUrl, resolveAuthToken, resetAuthLock } from '../client';

describe('Centralized API Client (src/api/client.js)', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, val) => { mockStorage[key] = String(val); }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
    });

    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    resetAuthLock();
  });

  describe('resolveUrl', () => {
    it('normalizes /products to /api/products', () => {
      expect(resolveUrl('/products')).toBe('/api/products');
    });

    it('avoids duplicate /api/api/products when input already has /api', () => {
      expect(resolveUrl('/api/products')).toBe('/api/products');
    });

    it('preserves absolute http/https URLs', () => {
      expect(resolveUrl('https://example.com/api/test')).toBe('https://example.com/api/test');
    });
  });

  describe('resolveAuthToken', () => {
    it('returns customer token by default when present', () => {
      mockStorage['dimsum_customer_token'] = 'cust_tok_123';
      expect(resolveAuthToken('/api/orders')).toBe('cust_tok_123');
    });

    it('returns admin token when auth: "admin"', () => {
      mockStorage['adminToken'] = 'admin_tok_999';
      expect(resolveAuthToken('/api/orders/123', 'admin')).toBe('admin_tok_999');
    });

    it('returns null when auth: false', () => {
      mockStorage['dimsum_customer_token'] = 'cust_tok_123';
      expect(resolveAuthToken('/api/products', false)).toBeNull();
    });

    it('falls back to adminToken when path starts with /api/admin', () => {
      mockStorage['adminToken'] = 'admin_fallback_token';
      expect(resolveAuthToken('/api/admin/banners')).toBe('admin_fallback_token');
    });
  });

  describe('401 Unauthorized Handling', () => {
    it('does NOT trigger logout on /api/auth/login (wrong password != expired session)', async () => {
      mockStorage['dimsum_customer_token'] = 'tok';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Invalid credentials' }),
      }));

      const res = await api.post('/api/auth/login', { email: 'wrong', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(mockStorage['dimsum_customer_token']).toBe('tok');
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('does NOT trigger logout if request did NOT carry a token', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      }));

      const res = await api.get('/api/public-check', { auth: false });
      expect(res.status).toBe(401);
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('TRIGGERS logout on normal endpoint when carrying customer token', async () => {
      mockStorage['dimsum_customer_token'] = 'expired_cust_tok';
      mockStorage['dimsum_customer_user'] = JSON.stringify({ name: 'Budi' });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Token expired' }),
      }));

      const res = await api.get('/api/orders/history', { auth: 'customer' });
      expect(res.status).toBe(401);
      expect(mockStorage['dimsum_customer_token']).toBeUndefined();
      expect(mockStorage['dimsum_customer_user']).toBeUndefined();
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('deduplicates multiple parallel 401 events into a single logout event', async () => {
      mockStorage['dimsum_customer_token'] = 'expired_cust_tok';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Token expired' }),
      }));

      await Promise.all([
        api.get('/api/endpoint1', { auth: 'customer' }),
        api.get('/api/endpoint2', { auth: 'customer' }),
        api.get('/api/endpoint3', { auth: 'customer' }),
      ]);

      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    it('handles: login -> 401 -> login lagi -> 401 -> logout terpicu dua kali', async () => {
      mockStorage['dimsum_customer_token'] = 'token_session_1';

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Token 1 expired' }),
      }));

      // Session 1 expired
      await api.get('/api/orders/history', { auth: 'customer' });
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);

      // User logs in again: successful auth response resets the lock
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { token: 'token_session_2' } }),
      }));

      await api.post('/api/auth/login', { email: 'test@example.com', password: 'password' });
      mockStorage['dimsum_customer_token'] = 'token_session_2';

      // Session 2 also expires later
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Token 2 expired' }),
      }));

      await api.get('/api/orders/history', { auth: 'customer' });
      expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
      expect(mockStorage['dimsum_customer_token']).toBeUndefined();
    });
  });

  describe('Non-JSON & HTML error handling', () => {
    it('handles HTTP 204 No Content gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 204,
        ok: true,
        headers: new Headers(),
      }));

      const res = await api.delete('/api/cart/clear');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
      expect(res.status).toBe(204);
    });

    it('handles Nginx/cPanel 502 Bad Gateway HTML without crashing', async () => {
      const html502 = `<html><body><h1>502 Bad Gateway</h1><p>The server encountered a temporary error.</p></body></html>`;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => html502,
      }));

      const res = await api.get('/api/products');
      expect(res.success).toBe(false);
      expect(res.status).toBe(502);
      expect(res.error).toContain('502');
    });
  });

  describe('AbortController and Timeout', () => {
    it('aborts request when timeout expires and returns status 408', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_, opts) => {
        return new Promise((resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation timed out');
            err.name = 'TimeoutError';
            reject(err);
          });
        });
      }));

      const res = await api.get('/api/slow-endpoint', { timeout: 20 });
      expect(res.success).toBe(false);
      expect(res.status).toBe(408);
      expect(res.isTimeout).toBe(true);
      expect(res.isAborted).toBe(true);
    });

    it('distinguishes user unmount abort (returns status 0, isUserAbort: true)', async () => {
      const controller = new AbortController();

      vi.stubGlobal('fetch', vi.fn().mockImplementation((_, opts) => {
        return new Promise((resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The user aborted a request');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }));

      const reqPromise = api.get('/api/polling-endpoint', { signal: controller.signal });
      controller.abort();
      const res = await reqPromise;

      expect(res.success).toBe(false);
      expect(res.status).toBe(0);
      expect(res.isUserAbort).toBe(true);
      expect(res.isAborted).toBe(true);
      expect(res.isTimeout).toBe(false);
    });
  });

  describe('FormData Handling', () => {
    it('does not set Content-Type header so browser can set multipart boundary', async () => {
      let capturedHeaders = null;
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, opts) => {
        capturedHeaders = opts.headers;
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: { uploaded: true } }),
        });
      }));

      const formData = new FormData();
      formData.append('file', 'mock_image_data');

      await api.upload('/api/banners', formData, { auth: false });
      expect(capturedHeaders['Content-Type']).toBeUndefined();
    });
  });

  describe('Standard Data Envelope', () => {
    it('extracts body.data directly into res.data', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: [{ id: 1, name: 'Dimsum Ayam' }],
          message: 'Berhasil memuat produk',
        }),
      }));

      const res = await api.get('/api/products');
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0].name).toBe('Dimsum Ayam');
      expect(res.message).toBe('Berhasil memuat produk');
    });
  });
});
