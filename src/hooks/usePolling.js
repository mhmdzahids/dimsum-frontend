import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

/**
 * usePolling - Resilient real-time polling hook with Page Visibility API & AbortController support.
 *
 * @param {string|null} url - API endpoint to poll. If null or options.enabled === false, polling is paused.
 * @param {Object} [options]
 * @param {number|Function} [options.interval=4000] - Polling interval in ms, or function (data, attempt) => number.
 * @param {boolean} [options.enabled=true] - Whether polling is active.
 * @param {Object} [options.headers] - Custom request headers (e.g. { 'X-Order-Token': ... }).
 * @param {string|false} [options.auth] - 'customer' | 'admin' | false.
 * @param {Function} [options.stopWhen] - Predicate (data) => boolean. Polling stops permanently when true.
 * @param {boolean} [options.pauseOnHidden=true] - Automatically pause polling when browser tab is hidden to save mobile data/battery.
 * @param {number} [options.maxAttempts=360] - Maximum polling attempts before timeout (~15-24 mins).
 * @param {Function} [options.onData] - Callback triggered when fresh data arrives: (data) => void.
 * @param {Function} [options.onError] - Callback triggered on request error: (errorMessage) => void.
 * @returns {{ data: any, isPolling: boolean, isRefreshing: boolean, error: string|null, refresh: Function, stop: Function, start: Function, setData: Function }}
 */
export function usePolling(url, options = {}) {
  const {
    interval = 4000,
    enabled = true,
    headers,
    auth,
    stopWhen,
    pauseOnHidden = true,
    maxAttempts = 360,
    onData,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [isPolling, setIsPolling] = useState(Boolean(url && enabled));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Keep latest mutable references to avoid stale closures
  const optionsRef = useRef({
    interval,
    headers,
    auth,
    stopWhen,
    pauseOnHidden,
    maxAttempts,
    onData,
    onError
  });

  useEffect(() => {
    optionsRef.current = {
      interval,
      headers,
      auth,
      stopWhen,
      pauseOnHidden,
      maxAttempts,
      onData,
      onError
    };
  });

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);
  const attemptsRef = useRef(0);
  const isStoppedRef = useRef(!enabled);
  const isMountedRef = useRef(true);

  const executePoll = useCallback(async (isManualRefresh = false) => {
    if (!url || isStoppedRef.current || !isMountedRef.current) return;

    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await api.get(url, {
        headers: optionsRef.current.headers,
        auth: optionsRef.current.auth,
        signal: controller.signal
      });

      if (res.isAborted || res.isUserAbort || controller.signal.aborted || !isMountedRef.current) {
        return;
      }

      if (res.success && res.data) {
        setData(res.data);
        setError(null);
        optionsRef.current.onData?.(res.data);

        // Check if termination condition is met
        if (optionsRef.current.stopWhen?.(res.data)) {
          isStoppedRef.current = true;
          setIsPolling(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          return;
        }
      } else {
        const errMsg = res.error || 'Gagal memuat pembaruan status';
        setError(errMsg);
        optionsRef.current.onError?.(errMsg);
      }
    } catch (err) {
      if (controller.signal.aborted || !isMountedRef.current) return;
      const errMsg = err.message || 'Koneksi terputus';
      setError(errMsg);
      optionsRef.current.onError?.(errMsg);
    } finally {
      if (isMountedRef.current && isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  }, [url]);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!url || isStoppedRef.current || !isMountedRef.current) return;

    attemptsRef.current += 1;
    if (attemptsRef.current > optionsRef.current.maxAttempts) {
      isStoppedRef.current = true;
      setIsPolling(false);
      return;
    }

    // Calculate delay (supports static ms or dynamic function)
    const currentInterval = optionsRef.current.interval;
    const delay = typeof currentInterval === 'function'
      ? currentInterval(dataRef.current, attemptsRef.current)
      : currentInterval;

    timerRef.current = setTimeout(async () => {
      // If Page Visibility API enabled and page is hidden, pause polling
      if (
        optionsRef.current.pauseOnHidden &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        // Will be resumed by visibilitychange event listener
        return;
      }

      await executePoll(false);
      scheduleNext();
    }, delay);
  }, [url, executePoll]);

  // Main lifecycle effect
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !url) {
      isStoppedRef.current = true;
      setIsPolling(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    isStoppedRef.current = false;
    setIsPolling(true);
    attemptsRef.current = 0;

    // Initial immediate fetch
    executePoll(false).then(() => {
      scheduleNext();
    });

    // Page Visibility API listener: resume immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible' && !isStoppedRef.current) {
        executePoll(false).then(() => {
          scheduleNext();
        });
      }
    };

    if (optionsRef.current.pauseOnHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [url, enabled, executePoll, scheduleNext]);

  const refresh = useCallback(() => executePoll(true), [executePoll]);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    setIsPolling(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const start = useCallback(() => {
    isStoppedRef.current = false;
    setIsPolling(true);
    attemptsRef.current = 0;
    executePoll(false).then(() => scheduleNext());
  }, [executePoll, scheduleNext]);

  return {
    data,
    isPolling,
    isRefreshing,
    error,
    refresh,
    stop,
    start,
    setData
  };
}

export default usePolling;
