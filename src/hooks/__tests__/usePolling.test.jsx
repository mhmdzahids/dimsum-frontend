// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePolling } from '../usePolling';
import api from '../../api/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('usePolling hook', () => {
  let container;
  let root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function renderHookHelper(hookFn) {
    let result = {};
    function TestComponent() {
      const hookRes = hookFn();
      Object.assign(result, hookRes);
      return <div data-testid="test">{hookRes.isPolling ? 'polling' : 'idle'}</div>;
    }
    act(() => {
      root.render(<TestComponent />);
    });
    return result;
  }

  it('polls at regular intervals and updates data', async () => {
    const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({
      success: true,
      data: { status: 'pending_payment' },
      status: 200
    });

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => usePolling('/api/orders/ORD-1', { interval: 3000 }));
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(hookResult.data).toEqual({ status: 'pending_payment' });
    expect(hookResult.isPolling).toBe(true);

    // Fast-forward timer by 3000ms using advanceTimersByTimeAsync
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);

    // Fast-forward another 3000ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(apiSpy).toHaveBeenCalledTimes(3);
  });

  it('stops polling permanently when stopWhen condition is met', async () => {
    let callCount = 0;
    const apiSpy = vi.spyOn(api, 'get').mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        success: true,
        data: { status: callCount >= 2 ? 'completed' : 'fulfilling' },
        status: 200
      });
    });

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => usePolling('/api/orders/ORD-2', {
        interval: 2000,
        stopWhen: (d) => d?.status === 'completed'
      }));
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(hookResult.isPolling).toBe(true);

    // 1st interval tick -> returns completed
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
    expect(hookResult.data?.status).toBe('completed');
    expect(hookResult.isPolling).toBe(false);

    // Further timer advance does NOT trigger new requests
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
  });

  it('pauses polling when page visibility is hidden', async () => {
    const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({
      success: true,
      data: { status: 'pending' },
      status: 200
    });

    await act(async () => {
      renderHookHelper(() => usePolling('/api/orders/ORD-3', {
        interval: 2000,
        pauseOnHidden: true
      }));
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);

    // Simulate tab minimize / switch
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    // Should NOT have polled while hidden
    expect(apiSpy).toHaveBeenCalledTimes(1);

    // Simulate tab restore / visibility active
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Immediately resumes and polls
    expect(apiSpy).toHaveBeenCalledTimes(2);
  });

  it('manual refresh triggers immediate fetch without waiting for interval', async () => {
    const apiSpy = vi.spyOn(api, 'get').mockResolvedValue({
      success: true,
      data: { status: 'pending' },
      status: 200
    });

    let hookResult;
    await act(async () => {
      hookResult = renderHookHelper(() => usePolling('/api/orders/ORD-4', { interval: 10000 }));
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);

    // User clicks manual refresh button
    await act(async () => {
      await hookResult.refresh();
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
  });
});
