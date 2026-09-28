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
  Info,
  ArrowLeftRight
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
  const [packCount, setPackCount] = useState(1);
  const [notes, setNotes] = useState('');

  // Quick Rebalance Modal State
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [rebalanceQty, setRebalanceQty] = useState(5);
  const [rebalanceFromPool, setRebalanceFromPool] = useState('offline');
  const [rebalanceReason, setRebalanceReason] = useState('');
  const [rebalanceSubmitting, setRebalanceSubmitting] = useState(false);
  const [rebalanceError, setRebalanceError] = useState('');

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

  const handleQuickRebalanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setRebalanceSubmitting(true);
    setRebalanceError('');

    const toPool = rebalanceFromPool === 'offline' ? 'online' : 'offline';
    try {
      const res = await api.post('/api/inventory/stock-rebalance', {
        product_id: selectedProductId,
        from_pool: rebalanceFromPool,
        to_pool: toPool,
        quantity: Number(rebalanceQty),
        reason: rebalanceReason || `Penyesuaian kuota untuk ${selectedChannel.toUpperCase()}`
      }, { auth: 'admin' });

      if (res.success) {
        setSuccessMsg(res.message || 'Transfer kuota berhasil!');
        setRebalanceModalOpen(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setRebalanceError(res.error || 'Gagal memproses transfer kuota');
      }
    } catch {
      setRebalanceError('Koneksi bermasalah saat memproses transfer kuota');
    } finally {
      setRebalanceSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const calculatedQty = Number(packCount || 0);

  const isOnlineChannel = selectedChannel === 'shopee' || selectedChannel === 'tiktok';
  const stockOff = selectedProduct ? (selectedProduct.stock_offline ?? Math.round((selectedProduct.stock_qty || 0) * 0.6)) : 0;
  const stockOn = selectedProduct ? (selectedProduct.stock_online ?? Math.round((selectedProduct.stock_qty || 0) * 0.4)) : 0;
  const activeQuota = isOnlineChannel ? stockOn : stockOff;
  const otherPoolName = isOnlineChannel ? 'Offline' : 'Online';
  const otherQuota = isOnlineChannel ? stockOff : stockOn;
  const isQuotaExceeded = calculatedQty > activeQuota;
  const deficit = Math.max(1, calculatedQty - activeQuota);

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
        setPackCount(1);
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
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-xs cursor-pointer"
              >
                {products.map(p => {
                  const isMika = (p.sku || '').includes('MIKA') || (p.name || '').toLowerCase().includes('mika');
                  const pSize = p.pack_size || (isMika ? 50 : 25);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — [Isi {pSize} Pcs] (Stok: {p.stock_qty} pack)
                    </option>
                  );
                })}
              </select>

              {selectedProduct && (() => {
                const isMika = (selectedProduct.sku || '').includes('MIKA') || (selectedProduct.name || '').toLowerCase().includes('mika');
                const pSize = selectedProduct.pack_size || (isMika ? 50 : 25);

                return (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-text-secondary block">Total Stok Fisik di Freezer:</span>
                          <span className="font-bold text-text-primary text-sm">
                            {selectedProduct.stock_qty} Pack <span className="text-xs font-normal text-gray-500">(~{selectedProduct.stock_qty * pSize} butir)</span>
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${selectedProduct.buffer_status === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                          selectedProduct.buffer_status === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                          {selectedProduct.buffer_label}
                        </span>
                      </div>

                      {/* Quota Distribution Pills */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60">
                        <div className={`p-2 rounded-xl border flex flex-col ${!isOnlineChannel
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-gray-200 opacity-70'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase">Kuota Offline</span>
                            {!isOnlineChannel && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>}
                          </div>
                          <span className="text-xs font-black text-text-primary mt-0.5">{stockOff} Pack</span>
                          <span className="text-[9px] text-text-secondary">Kasir / Web / PO</span>
                        </div>

                        <div className={`p-2 rounded-xl border flex flex-col ${isOnlineChannel
                          ? 'bg-pink-50/70 border-pink-300 ring-1 ring-pink-300'
                          : 'bg-white border-gray-200 opacity-70'
                          }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-pink-800 uppercase">Kuota Online</span>
                            {isOnlineChannel && <span className="text-[9px] bg-pink-600 text-white px-1.5 py-0.2 rounded font-bold">AKTIF</span>}
                          </div>
                          <span className="text-xs font-black text-text-primary mt-0.5">{stockOn} Pack</span>
                          <span className="text-[9px] text-text-secondary">Shopee / TikTok</span>
                        </div>
                      </div>
                    </div>

                    {/* Quota Exceeded Warning & Quick Transfer Trigger */}
                    {isQuotaExceeded && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Kuota {isOnlineChannel ? 'Online' : 'Offline'} Kurang {deficit} Pack!</span>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              Tersedia di pool ini: {activeQuota} pack. Ada {otherQuota} pack di kuota {otherPoolName}.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={otherQuota <= 0}
                          onClick={() => {
                            setRebalanceFromPool(isOnlineChannel ? 'offline' : 'online');
                            setRebalanceQty(Math.min(deficit, otherQuota));
                            setRebalanceReason(`Penyesuaian untuk pengeluaran ${selectedChannel.toUpperCase()}`);
                            setRebalanceError('');
                            setRebalanceModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <ArrowLeftRight size={13} />
                          <span>Transfer {Math.min(deficit, otherQuota)} Pack</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Input Jumlah Pack/Mika */}
            <div>
              <label className="block text-text-primary font-semibold mb-1">
                Jumlah Kemasan Yang Dikeluarkan (Pack / Mika) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_qty || 5000}
                  required
                  value={packCount}
                  onChange={(e) => setPackCount(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-bold text-sm"
                />
                <span className="text-text-secondary font-medium">Pack</span>
                {selectedProduct && (() => {
                  const isMika = (selectedProduct.sku || '').includes('MIKA') || (selectedProduct.name || '').toLowerCase().includes('mika');
                  const pSize = selectedProduct.pack_size || (isMika ? 50 : 25);
                  return (
                    <div className="ml-auto px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-bold text-xs">
                      = {Number(packCount || 0) * pSize} Butir Dimsum
                    </div>
                  );
                })()}
              </div>
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
                  {selectedProduct.stock_qty - calculatedQty} Pack
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
                      <th className="py-2.5 px-3">Produk & Batch Kemasan</th>
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
                                    Batch: {tx.batch_code}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Stok Awal (Non-Batch)</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-red-600">
                              -{tx.quantity} pack
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

      {/* Modal Quick Transfer Kuota */}
      {rebalanceModalOpen && selectedProduct && (() => {
        const maxTransfer = rebalanceFromPool === 'offline' ? stockOff : stockOn;
        const toPool = rebalanceFromPool === 'offline' ? 'online' : 'offline';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
              <button
                type="button"
                onClick={() => setRebalanceModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Transfer Kuota Stok
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>

              {rebalanceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{rebalanceError}</span>
                </div>
              )}

              <form onSubmit={handleQuickRebalanceSubmit} className="space-y-4 text-xs font-body">
                {/* Quotas Info */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <div className="p-2 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">Stok Offline</span>
                    <span className="text-sm font-black text-emerald-800 font-heading">{stockOff} Pack</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-pink-100">
                    <span className="text-[10px] text-pink-700 font-bold block uppercase">Stok Online</span>
                    <span className="text-sm font-black text-pink-800 font-heading">{stockOn} Pack</span>
                  </div>
                </div>

                {/* Transfer Direction Switcher */}
                <div>
                  <label className="block text-text-primary font-semibold mb-1">
                    Arah Transfer Kuota *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRebalanceFromPool('offline')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${rebalanceFromPool === 'offline'
                        ? 'border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue text-brand-blue font-bold'
                        : 'border-gray-200 bg-white text-text-secondary hover:bg-gray-50 font-medium'
                        }`}
                    >
                      Offline ➔ Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setRebalanceFromPool('online')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${rebalanceFromPool === 'online'
                        ? 'border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue text-brand-blue font-bold'
                        : 'border-gray-200 bg-white text-text-secondary hover:bg-gray-50 font-medium'
                        }`}
                    >
                      Online ➔ Offline
                    </button>
                  </div>
                </div>

                {/* Transfer Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-primary font-semibold">
                      Jumlah Pack *
                    </label>
                    <span className="text-[11px] text-text-secondary">
                      Tersedia: <strong>{maxTransfer} pack</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={maxTransfer || 1}
                      required
                      value={rebalanceQty}
                      onChange={(e) => setRebalanceQty(e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-bold text-sm"
                    />
                    <div className="flex items-center gap-1">
                      {[5, 10, 20].map(n => (
                        <button
                          key={n}
                          type="button"
                          disabled={maxTransfer < n}
                          onClick={() => setRebalanceQty(n)}
                          className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-semibold text-text-secondary"
                        >
                          +{n}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={maxTransfer <= 0}
                        onClick={() => setRebalanceQty(maxTransfer)}
                        className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold disabled:opacity-40"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transfer Reason */}
                <div>
                  <label className="block text-text-primary font-semibold mb-1">
                    Alasan / Catatan
                  </label>
                  <input
                    type="text"
                    value={rebalanceReason}
                    onChange={(e) => setRebalanceReason(e.target.value)}
                    placeholder="Contoh: Pesanan Shopee melonjak"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRebalanceModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-text-secondary hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={rebalanceSubmitting || maxTransfer <= 0 || Number(rebalanceQty) <= 0}
                    className="px-5 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {rebalanceSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ArrowLeftRight size={13} />
                        <span>Transfer ke {toPool.toUpperCase()}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
