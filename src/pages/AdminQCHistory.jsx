import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  QrCode,
  Search,
  RefreshCw,
  Layers,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  Package,
  Check,
  LayoutGrid,
  List
} from 'lucide-react';
import api from '../api/client';
import { getAdminUser, getAdminRole } from '../utils/adminAuth';
import LotStickerModal from '../components/inventory/LotStickerModal';
import Pagination from '../components/ui/Pagination';

export default function AdminQCHistory() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStickerBatch, setSelectedStickerBatch] = useState(null);

  // View mode switcher: 'grid' (card view) or 'list' (compact table view)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('dimsum_qc_history_view') || 'grid';
    } catch {
      return 'grid';
    }
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const currentUser = getAdminUser();
  const userRole = getAdminRole() || 'checker';

  const fetchQCHistory = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch completed batches
      const res = await api.get('/api/inventory/batches?status=completed&limit=150', { auth: 'admin' });
      if (res.success) {
        setBatches(res.data || []);
      } else {
        setError(res.error || 'Gagal memuat riwayat produk QC');
      }
    } catch {
      setError('Koneksi terganggu saat mengambil data riwayat QC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCHistory();
  }, []);

  // Reset to page 1 whenever search query or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('dimsum_qc_history_view', mode);
    } catch {
      // ignore localStorage write restrictions
    }
  };

  // Filter batches by search query (batch code, product name, SKU, checker name)
  const filteredBatches = batches.filter(batch => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (batch.batch_code && batch.batch_code.toLowerCase().includes(q)) ||
      (batch.product_name && batch.product_name.toLowerCase().includes(q)) ||
      (batch.product_sku && batch.product_sku.toLowerCase().includes(q)) ||
      (batch.checker_name && batch.checker_name.toLowerCase().includes(q))
    );
  });

  // Paginated chunk of filtered batches
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate summary metrics
  const totalVerifiedBatches = batches.length;
  const totalActualLots = batches.reduce((sum, b) => sum + (Number(b.actual_lots) || 0), 0);
  const totalProducedPcs = batches.reduce((sum, b) => sum + (Number(b.produced_qty) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Summary KPI Cards (Strictly Operational - No Pricing/Financial Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Batch Terverifikasi
            </span>
            <div className="text-2xl font-black text-text-primary mt-0.5">
              {totalVerifiedBatches} <span className="text-xs font-semibold text-text-secondary font-body">Batch</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue border border-blue-200 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Kemasan Berstiker
            </span>
            <div className="text-2xl font-black text-text-primary mt-0.5">
              {totalActualLots} <span className="text-xs font-semibold text-text-secondary font-body">Pack / Mika</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Butir Masuk Stok
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">
              {totalProducedPcs.toLocaleString('id-ID')} <span className="text-xs font-semibold text-emerald-600 font-body">Butir</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, View Switcher (Grid/List), Page Size & Refresh */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode batch, produk, atau QC..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 text-xs outline-none bg-gray-50/50"
          />
        </div>

        {/* View Switcher, Page Size, & Refresh Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* View Mode Toggle Button (Grid vs List) */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              title="Tampilan Kartu (Grid)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              title="Tampilan Tabel (List)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'list'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="hidden lg:inline text-[11px]">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-text-primary text-xs font-bold outline-none cursor-pointer focus:border-amber-700"
            >
              <option value={10}>10 / hal</option>
              <option value={20}>20 / hal</option>
              <option value={50}>50 / hal</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchQCHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchQCHistory} className="underline font-bold hover:text-red-950">
            Coba lagi
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-xs">
          <RefreshCw size={30} className="animate-spin text-amber-700 mx-auto mb-3" />
          <p className="text-xs font-semibold text-text-secondary">Memuat riwayat verifikasi QC...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={32} />
          </div>
          <h4 className="font-bold text-base text-text-primary font-heading">
            {searchQuery ? 'Tidak Ada Data yang Cocok' : 'Belum Ada Riwayat Batch Selesai QC'}
          </h4>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ditemukan batch dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
              : 'Batch produksi yang telah diverifikasi fisik oleh Checker akan muncul di sini beserta stiker QR-nya.'}
          </p>
        </div>
      ) : (
        <>
          {/* MODE 1: GRID VIEW (CARD VIEW) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBatches.map((batch) => {
                const plannedLots = Number(batch.planned_lots) || 0;
                const actualLots = Number(batch.actual_lots) || 0;
                const looseQty = Number(batch.loose_qty) || 0;
                const packSize = batch.lot_size || (batch.packaging_type === 'mika' ? 50 : 25);
                const producedQty = Number(batch.produced_qty) || (actualLots * packSize) + looseQty;
                const diffLots = actualLots - plannedLots;

                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-amber-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <Check size={10} strokeWidth={3} />
                              Lolos QC
                            </span>
                            {diffLots > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-brand-blue font-bold text-[10px]">
                                Surplus +{diffLots} Kemasan
                              </span>
                            ) : diffLots < 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                                Kurang {diffLots} Kemasan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[10px]">
                                Pas Target
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-base text-text-primary font-heading line-clamp-1 group-hover:text-amber-800 transition-colors">
                            {batch.product_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {batch.batch_code}
                            </span>
                            {batch.product_sku && (
                              <span className="text-[11px] text-text-secondary font-mono">
                                SKU: {batch.product_sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Breakdown Box */}
                      <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2 mb-4 text-xs font-body">
                        <div className="flex justify-between items-center text-text-secondary">
                          <span>Target Rencana:</span>
                          <span className="font-semibold text-text-primary">
                            {plannedLots} Pack ({plannedLots * packSize} butir)
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-text-secondary">
                          <span>Hasil Fisik QC:</span>
                          <span className="font-bold text-emerald-700">
                            {actualLots} Kemasan Utuh {looseQty > 0 && `+ ${looseQty} butir eceran`}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-200/70 flex justify-between items-center">
                          <span className="font-bold text-text-primary">Total Hasil Kemasan:</span>
                          <span className="font-extrabold text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {actualLots} Pack (~{producedQty} butir)
                          </span>
                        </div>
                      </div>

                      {/* Footer Info: Checker & Date */}
                      <div className="space-y-1 text-[11px] text-text-secondary mb-4 px-1">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-400 shrink-0" />
                          <span>QC Checker: </span>
                          <strong className="text-text-primary">{batch.checker_name || 'Om Yosi / QC'}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>Selesai: </span>
                          <span className="text-text-primary">{formatDate(batch.completed_at || batch.produced_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Reprint/View Stickers */}
                    <button
                      onClick={() => setSelectedStickerBatch(batch)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
                    >
                      <QrCode size={15} />
                      <span>Buka & Cetak Stiker QR ({actualLots} Kemasan)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 2: LIST VIEW (COMPACT TABLE VIEW) */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/90 border-b border-gray-200 text-text-secondary uppercase text-[10.5px] font-bold tracking-wider">
                      <th className="py-3.5 px-4">Batch / Status</th>
                      <th className="py-3.5 px-4">Produk & SKU</th>
                      <th className="py-3.5 px-4">Target Rencana</th>
                      <th className="py-3.5 px-4">Hasil Fisik QC</th>
                      <th className="py-3.5 px-4 text-center">Masuk Freezer</th>
                      <th className="py-3.5 px-4">Yield</th>
                      <th className="py-3.5 px-4">QC Verifikator</th>
                      <th className="py-3.5 px-4">Waktu Selesai</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-body">
                    {paginatedBatches.map((batch) => {
                      const plannedLots = Number(batch.planned_lots) || 0;
                      const actualLots = Number(batch.actual_lots) || 0;
                      const looseQty = Number(batch.loose_qty) || 0;
                      const packSize = batch.lot_size || (batch.packaging_type === 'mika' ? 50 : 25);
                      const producedQty = Number(batch.produced_qty) || (actualLots * packSize) + looseQty;
                      const diffLots = actualLots - plannedLots;

                      return (
                        <tr
                          key={batch.id}
                          className="hover:bg-amber-50/30 transition-colors"
                        >
                          {/* Batch Code & Status */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-brand-blue block">
                              {batch.batch_code}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded mt-0.5">
                              <Check size={9} strokeWidth={3} /> Lolos QC
                            </span>
                          </td>

                          {/* Product Name & SKU */}
                          <td className="py-3 px-4">
                            <strong className="text-text-primary font-heading text-xs block">
                              {batch.product_name}
                            </strong>
                            {batch.product_sku && (
                              <span className="text-[11px] text-text-secondary font-mono">
                                SKU: {batch.product_sku}
                              </span>
                            )}
                          </td>

                          {/* Target Rencana */}
                          <td className="py-3 px-4 text-text-secondary">
                            <span className="font-semibold text-text-primary">
                              {plannedLots} Pack
                            </span>
                            <span className="block text-[11px] text-text-secondary">
                              ({plannedLots * packSize} butir)
                            </span>
                          </td>

                          {/* Hasil Fisik QC */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-900 block">
                              {actualLots} Kemasan Utuh
                            </span>
                            {looseQty > 0 ? (
                              <span className="text-[10.5px] text-amber-700 font-medium block">
                                + {looseQty} butir eceran
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 block">0 eceran</span>
                            )}
                          </td>

                          {/* Masuk Penyimpanan */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs">
                              {actualLots} Pack
                            </span>
                          </td>

                          {/* Yield Status */}
                          <td className="py-3 px-4">
                            {diffLots > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-brand-blue font-bold text-[10px] whitespace-nowrap">
                                Surplus +{diffLots} Kemasan
                              </span>
                            ) : diffLots < 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] whitespace-nowrap">
                                Kurang {diffLots} Kemasan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[10px] whitespace-nowrap">
                                Pas Target
                              </span>
                            )}
                          </td>

                          {/* Checker Name */}
                          <td className="py-3 px-4 text-text-primary font-medium text-xs whitespace-nowrap">
                            {batch.checker_name || 'Om Yosi / QC'}
                          </td>

                          {/* Selesai Date */}
                          <td className="py-3 px-4 text-text-secondary text-[11px] whitespace-nowrap">
                            {formatDate(batch.completed_at || batch.produced_at)}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedStickerBatch(batch)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                              title={`Buka & Cetak Stiker QR (${actualLots} Kemasan)`}
                            >
                              <QrCode size={13} />
                              <span>Stiker QR</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredBatches.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredBatches.length}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                itemLabel="batch QC"
                showInfo={true}
              />
            </div>
          )}
        </>
      )}

      {/* Lot Sticker Modal */}
      {selectedStickerBatch && (
        <LotStickerModal
          batch={selectedStickerBatch}
          onClose={() => setSelectedStickerBatch(null)}
        />
      )}
    </div>
  );
}
