import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ShoppingBag,
  Video,
  Briefcase,
  Store,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Layers,
  History,
  Search,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';

const CHANNELS = [
  { id: 'shopee', name: 'Shopee', icon: ShoppingBag, badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'tiktok', name: 'TikTok', icon: Video, badge: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'po_b2b', name: 'PO B2B', icon: Briefcase, badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'offline', name: 'Offline', icon: Store, badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'waste', name: 'Rusak / Sample', icon: Trash2, badge: 'bg-gray-100 text-gray-700 border-gray-200' }
];

export default function AdminStockOut() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('shopee');
  const [inputMode, setInputMode] = useState('lot'); // 'lot' | 'pcs'
  const [lotCount, setLotCount] = useState(1);
  const [pcsCount, setPcsCount] = useState(25);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, txRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/inventory/transactions?limit=50', { auth: 'admin' })
      ]);

      if (prodRes.success) {
        setProducts(prodRes.data || []);
        if (!selectedProductId && prodRes.data?.length > 0) {
          setSelectedProductId(prodRes.data[0].id);
        }
      }

      if (txRes.success) {
        setTransactions(txRes.data?.filter(t => t.type === 'out') || []);
      }
    } catch {
      setError('Koneksi terputus saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const calculatedQty = inputMode === 'lot' ? Number(lotCount || 0) * 25 : Number(pcsCount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const payload = {
        product_id: selectedProductId,
        quantity: calculatedQty,
        channel: selectedChannel,
        notes: notes || undefined
      };

      const res = await api.post('/api/inventory/stock-out', payload, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg(res.message || `Stok berhasil dikeluarkan ke ${selectedChannel.toUpperCase()}!`);
        setNotes('');
        if (inputMode === 'lot') setLotCount(1);
        else setPcsCount(25);
        fetchData();
      } else {
        setError(res.error || 'Gagal mencatat pengeluaran stok');
      }
    } catch {
      setError('Koneksi bermasalah saat memproses pengeluaran stok');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Pengeluaran Stok (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs h-fit">
          <h3 className="text-base font-bold text-text-primary font-heading mb-4 flex items-center gap-2">
            <span>Form Pengeluaran Stok</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body">
            {/* Saluran Penjualan */}
            <div>
              <label className="block text-text-primary font-semibold mb-1.5">
                Pilih Saluran / Tujuan Pengeluaran *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(ch => {
                  const Icon = ch.icon;
                  const isSelected = selectedChannel === ch.id;
                  return (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-950 ring-1 ring-orange-400 font-bold'
                        : 'border-gray-200 bg-white text-text-secondary hover:bg-gray-50 font-medium'
                        }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-orange-600' : 'text-gray-400'} />
                      <span className="text-[11px] leading-tight line-clamp-1">{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Produk */}
            <div>
              <label className="block text-text-primary font-semibold mb-1">
                Pilih Produk Dimsum *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {p.stock_qty} pcs)
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-text-secondary block">Stok Tersedia di Freezer:</span>
                    <span className="font-bold text-text-primary text-sm">
                      {selectedProduct.stock_qty} Pcs (~{Math.floor(selectedProduct.stock_qty / 25)} Lot)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${selectedProduct.buffer_status === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    selectedProduct.buffer_status === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                    {selectedProduct.buffer_label}
                  </span>
                </div>
              )}
            </div>

            {/* Input Mode: Lot vs Pcs */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-text-primary font-semibold">
                  Jumlah Yang Dikeluarkan *
                </label>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setInputMode('lot')}
                    className={`px-2 py-0.5 rounded-md ${inputMode === 'lot' ? 'bg-white text-orange-700 shadow-xs' : 'text-gray-500'}`}
                  >
                    Hitung Lot (x25)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('pcs')}
                    className={`px-2 py-0.5 rounded-md ${inputMode === 'pcs' ? 'bg-white text-orange-700 shadow-xs' : 'text-gray-500'}`}
                  >
                    Custom Pcs
                  </button>
                </div>
              </div>

              {inputMode === 'lot' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={lotCount}
                    onChange={(e) => setLotCount(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-bold text-sm"
                  />
                  <span className="text-text-secondary font-medium">Lot</span>
                  <div className="ml-auto px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-bold text-xs">
                    = {Number(lotCount || 0) * 25} Pcs
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={pcsCount}
                    onChange={(e) => setPcsCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-bold text-sm"
                  />
                  <span className="text-text-secondary font-medium shrink-0">Pcs</span>
                </div>
              )}
            </div>

            {/* Catatan / No. Resi */}
            <div>
              <label className="block text-text-primary font-semibold mb-1">
                Catatan / No. Resi / Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Resi Shopee SPX... / Order B2B Pak Haji"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Preview Sisa Stok Setelah Keluar */}
            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center text-xs">
                <span className="text-text-secondary">Estimasi Sisa Stok:</span>
                <span className={`font-bold ${(selectedProduct.stock_qty - calculatedQty) < 70 ? 'text-red-600 font-extrabold' : 'text-emerald-700'
                  }`}>
                  {selectedProduct.stock_qty - calculatedQty} Pcs
                  {(selectedProduct.stock_qty - calculatedQty) < 70 && ' (Akan Kritis!)'}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedProduct || calculatedQty <= 0 || calculatedQty > (selectedProduct?.stock_qty || 0)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Memproses...' : 'Keluarkan Stok Sekarang'}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pengeluaran Stok (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
              <History size={18} className="text-text-secondary" />
              <span>Riwayat Pengeluaran Stok Terbaru</span>
            </h3>
            <span className="text-xs text-text-secondary">
              {transactions.length} mutasi lot
            </span>
          </div>


          {loading ? (
            <div className="p-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-brand-blue" />
              <span>Memuat riwayat pengeluaran...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-text-secondary text-xs">
              Belum ada riwayat pengeluaran stok yang dicatat.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-body">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-text-secondary font-semibold">
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Saluran</th>
                      <th className="py-2.5 px-3">Produk & Lot Terpotong</th>
                      <th className="py-2.5 px-3 text-right">Jumlah Keluar</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((tx) => {
                        const channelMeta = CHANNELS.find(c => c.id === tx.channel) || {
                          name: tx.channel || 'Lainnya',
                          badge: 'bg-gray-100 text-gray-700'
                        };

                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-3 text-text-secondary text-[11px]">
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${channelMeta.badge}`}>
                                {channelMeta.name}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-text-primary">
                              <div>{tx.product_name}</div>
                              {tx.batch_code ? (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] font-mono font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    Lot: {tx.batch_code}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Stok Awal (Non-Lot)</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-red-600">
                              -{tx.quantity} pcs
                            </td>
                            <td className="py-3 px-3 text-text-secondary text-[11px] italic max-w-xs truncate">
                              {tx.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {transactions.length > ITEMS_PER_PAGE && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={transactions.length}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={(p) => setCurrentPage(p)}
                    showInfo={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
