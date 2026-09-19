// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useQuery } from '../useQuery';
import api from '../../api/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('useQuery hook', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  function renderHookHelper(hookFn) {
    let result = {};
    function TestComponent() {
      const hookRes = hookFn();
      Object.assign(result, hookRes);
      return <div data-testid="test">{hookRes.loading ? 'loading' : 'ready'}</div>;
    }
    act(() => {
      root.render(<TestComponent />);
    });
    return result;
  }

  it('fetches data successfully and updates loading state', async () => {
    const mockProducts = [{ id: 1, name: 'Dimsum Ayam' }];
    vi.spyOn(api, 'get').mockResolvedValue({
      success: true,
      data: mockProducts,
      status: 200
    });

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => useQuery('/api/products'));
    });

    expect(hookResult.data).toEqual(mockProducts);
    expect(hookResult.loading).toBe(false);
    expect(hookResult.error).toBeNull();
  });

  it('handles error state when API request fails', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      success: false,
      error: 'Produk tidak ditemukan',
      status: 404
    });

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => useQuery('/api/unknown'));
    });

    expect(hookResult.data).toBeNull();
    expect(hookResult.loading).toBe(false);
    expect(hookResult.error).toBe('Produk tidak ditemukan');
  });

  it('does not run fetch when enabled is false', async () => {
    const apiSpy = vi.spyOn(api, 'get');

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => useQuery('/api/products', { enabled: false }));
    });

    expect(apiSpy).not.toHaveBeenCalled();
    expect(hookResult.loading).toBe(false);
    expect(hookResult.data).toBeNull();
  });
});
