import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

/**
 * Reusable Pagination component conforming to the Dimsum CMS design system.
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active 1-based page index
 * @param {number} props.totalItems - Total count of records
 * @param {number} [props.pageSize=10] - Number of records displayed per page
 * @param {Function} props.onPageChange - Handler receiving next target page (1-based)
 * @param {string} [props.itemLabel='data'] - Noun describing records (e.g. 'produk', 'pesanan')
 * @param {boolean} [props.showInfo=true] - Whether to show "Menampilkan X - Y dari Z"
 * @param {string} [props.className=''] - Additional wrapping styles
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = 'data',
  showInfo = true,
  className = ''
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalPages <= 1 && !showInfo) {
    return null;
  }

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

  const handlePage = (page) => {
    if (page >= 1 && page <= totalPages && page !== safeCurrentPage) {
      if (onPageChange) onPageChange(page);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center ${showInfo ? 'justify-between' : 'justify-end'} gap-3 text-xs text-text-secondary ${className}`}>
      {showInfo && (
        <div className="text-text-secondary font-medium">
          {totalItems === 0 ? (
            <span>Tidak ada {itemLabel}</span>
          ) : (
            <span>
              Menampilkan <span className="font-semibold text-text-primary">{startIndex}</span> -{' '}
              <span className="font-semibold text-text-primary">{endIndex}</span> dari{' '}
              <span className="font-semibold text-text-primary">{totalItems}</span> {itemLabel}
            </span>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => handlePage(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            aria-label="Halaman Sebelumnya"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-text-primary hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium text-xs shadow-2xs cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 font-bold select-none"
                  >
                    …
                  </span>
                );
              }

              const isActive = page === safeCurrentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePage(page)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-xs border border-brand-blue'
                      : 'bg-white border border-gray-200 text-text-primary hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePage(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            aria-label="Halaman Selanjutnya"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-text-primary hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium text-xs shadow-2xs cursor-pointer"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
