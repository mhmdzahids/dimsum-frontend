import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * DataView - Reusable state view handling loading, error, empty, and data states.
 *
 * @param {Object} props
 * @param {boolean} props.loading - Whether data is actively loading
 * @param {string|null} [props.error] - Error message if fetch failed
 * @param {any} props.data - Data payload
 * @param {React.ReactNode} [props.empty] - Custom node to render when data is empty
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {React.ReactNode} [props.loadingFallback] - Optional custom loading element
 * @param {Function} props.children - Render prop called with non-empty data: (data) => ReactNode
 */
export function DataView({
  loading,
  error,
  data,
  empty,
  onRetry,
  loadingFallback,
  children
}) {
  if (loading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 font-body text-[13px] text-text-secondary">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-5 my-4 bg-red-50/60 border border-red-100 rounded-2xl text-center">
        <AlertCircle size={32} className="text-red-500 mb-2" />
        <h4 className="font-heading font-bold text-[14.5px] text-red-900 mb-1">Gagal Memuat</h4>
        <p className="font-body text-[12.5px] text-red-700 max-w-[280px] mb-3">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-body font-bold text-[12px] rounded-lg shadow-2xs transition-transform active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    );
  }

  const isEmpty = data === null || data === undefined || (Array.isArray(data) && data.length === 0);

  if (isEmpty) {
    if (empty) return <>{empty}</>;
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <p className="font-body text-[13.5px] text-text-secondary">Tidak ada data untuk ditampilkan.</p>
      </div>
    );
  }

  if (typeof children === 'function') {
    return <>{children(data)}</>;
  }

  return <>{children}</>;
}

export default DataView;
