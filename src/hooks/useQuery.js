import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

/**
 * useQuery - Declarative data fetching hook with loading, error, and lifecycle safety.
 *
 * @param {string|null} url - Endpoint to fetch. If null or options.enabled === false, query does not run.
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether the query should automatically run on mount/dependency change.
 * @param {string|false} [options.auth] - 'customer' | 'admin' | false
 * @param {Object} [options.headers] - Custom request headers
 * @param {any} [options.initialData=null] - Initial data before query resolves
 * @param {Function} [options.onSuccess] - Callback when data successfully fetched: (data) => void
 * @param {Function} [options.onError] - Callback when fetch fails: (errorMessage) => void
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function, setData: Function }}
 */
export function useQuery(url, options = {}) {
  const {
    enabled = true,
    auth,
    headers,
    initialData = null,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(url && enabled));
  const [error, setError] = useState(null);

  // Keep latest callbacks in ref to prevent stale closures or unnecessary effect runs
  const callbacksRef = useRef({ onSuccess, onError });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  });

  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (customOptions = {}) => {
    if (!url) return;

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(url, {
        auth,
        headers,
        signal: controller.signal,
        ...customOptions
      });

      // Ignore if request was aborted on unmount or URL switch
      if (res.isAborted || res.isUserAbort || controller.signal.aborted) {
        return;
      }

      if (res.success) {
        setData(res.data);
        callbacksRef.current.onSuccess?.(res.data);
      } else {
        const errMsg = res.error || 'Gagal memuat data';
        setError(errMsg);
        callbacksRef.current.onError?.(errMsg);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const errMsg = err.message || 'Terjadi kesalahan sistem';
      setError(errMsg);
      callbacksRef.current.onError?.(errMsg);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url, auth, headers]);

  useEffect(() => {
    if (enabled && url) {
      fetchData();
    } else {
      setLoading(false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  };
}

export default useQuery;
