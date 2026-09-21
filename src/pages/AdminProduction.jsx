import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Printer, 
  X, 
  Sparkles, 
  Layers, 
  Calendar, 
  Check, 
  ShieldCheck, 
  FileText, 
  Ban, 
  ArrowRight
} from 'lucide-react';
import api from '../api/client';
import LotStickerModal from '../components/inventory/LotStickerModal';

const BATCH_STATUS_META = {
  planned: { label: 'Menunggu Verifikasi Checker', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Selesai & Masuk Stok', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

export default function AdminProduction() {
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'checker'
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [plannedLots, setPlannedLots] = useState(4);
  const [planNotes, setPlanNotes] = useState('Produksi Harian Reguler');
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Checker Confirm Modal State
  const [confirmingBatch, setConfirmingBatch] = useState(null);
  const [actualLots, setActualLots] = useState(1);
  const [looseQty, setLooseQty] = useState(0);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Print Sticker Modal State
  const [selectedStickerBatch, setSelectedStickerBatch] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchesRes, productsRes] = await Promise.all([
        api.get('/api/inventory/batches?limit=50', { auth: 'admin' }),
        api.get('/api/products')
      ]);

      if (batchesRes.success) {
        setBatches(batchesRes.data || []);
      } else {
        setError(batchesRes.error || 'Gagal memuat batch produksi');
      }

      if (productsRes.success) {
        setProducts(productsRes.data || []);
        if (!selectedProductId && productsRes.data?.length > 0) {
          setSelectedProductId(productsRes.data[0].id);
        }
      }
    } catch {
      setError('Koneksi ke server terputus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setPlanError('');
    setSubmittingPlan(true);

    try {
      const res = await api.post('/api/inventory/production/plan', {
        product_id: selectedProductId,
        planned_lots: Number(plannedLots),
        notes: planNotes,
        lot_size: 25
      }, { auth: 'admin' });

      if (res.success) {
        setSuccessMsg(`Rencana produksi ${res.data.batch_code} (${res.data.planned_lots} Lot = ${res.data.planned_lots * 25} Produk) berhasil dibuat! Menunggu verifikasi Om Yosi/Checker.`);
        setShowPlanModal(false);
        fetchData();
      } else {
        setPlanError(res.error || 'Gagal membuat rencana produksi');
      }
    } catch {
      setPlanError('Koneksi bermasalah saat mengirim rencana produksi');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleConfirmActual = async (e) => {
    e.preventDefault();
    if (!confirmingBatch) return;
    setConfirmError('');
    setSubmittingConfirm(true);

    try {
      const res = await api.post(`/api/inventory/production/${confirmingBatch.id}/confirm`, {
        actual_lots: Number(actualLots),
        loose_qty: Number(looseQty)
      }, { auth: 'admin' });

      if (res.success) {
        const completedBatch = res.data;
        setSuccessMsg(`Produksi ${completedBatch.batch_code} berhasil diverifikasi! ${completedBatch.produced_qty} produk resmi masuk stok freezer.`);
        setConfirmingBatch(null);
        fetchData();
        // Immediately open sticker print modal for the checker!
        setSelectedStickerBatch(completedBatch);
      } else {
        setConfirmError(res.error || 'Gagal mengonfirmasi hasil produksi');
      }
    } catch {
      setConfirmError('Koneksi bermasalah saat mengonfirmasi produksi');
    } finally {
      setSubmittingConfirm(false);
    }
  };

  const handleCancelBatch = async (batchId) => {
    if (!window.confirm('Yakin ingin membatalkan rencana produksi ini?')) return;
    try {
      const res = await api.post(`/api/inventory/production/${batchId}/cancel`, {
        reason: 'Dibatalkan oleh tim perencanaan'
      }, { auth: 'admin' });

      if (res.success) {
        setSuccessMsg('Rencana produksi berhasil dibatalkan.');
        fetchData();
      } else {
        setError(res.error || 'Gagal membatalkan rencana produksi');
      }
    } catch {
      setError('Koneksi bermasalah saat membatalkan');
    }
  };

  const pendingBatches = batches.filter(b => b.status === 'planned');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-[11px] font-bold">
              1 Lot = 25 Produk (Pcs/Mika)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2.5">
            <Factory className="text-brand-blue" size={26} />
            <span>Portal Produksi Online</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Alur 2-Langkah: Perencanaan Harian (Ayu & Lala / PPSI) ➡️ Verifikasi Fisik & Cetak QR Lot (Om Yosi / Checker).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setShowPlanModal(true); setPlanError(''); }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <PlusCircle size={16} />
            <span>Buat Rencana Lot Baru</span>
          </button>
        </div>
      </div>

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

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'planner'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
          }`}
        >
          <FileText size={15} />
          <span>Rencana Produksi & Riwayat ({batches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('checker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors relative ${
            activeTab === 'checker'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Verifikasi Checker (Om Yosi)</span>
          {pendingBatches.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
              {pendingBatches.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PLANNER & BATCH LIST */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* Quick Stats / Capacity Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-text-secondary font-medium block">Total Rencana Hari Ini</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-text-primary font-heading">
                  {batches.filter(b => b.status === 'planned').reduce((acc, b) => acc + (b.planned_lots || 0), 0)} Lot
                </span>
                <span className="text-xs text-text-secondary">
                  (~{batches.filter(b => b.status === 'planned').reduce((acc, b) => acc + (b.planned_lots || 0), 0) * 25} Pcs)
                </span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                Menunggu konfirmasi Checker
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-text-secondary font-medium block">Selesai Masuk Freezer</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-700 font-heading">
                  {batches.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.produced_qty || 0), 0)} Pcs
                </span>
                <span className="text-xs text-text-secondary">
                  ({batches.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.actual_lots || 0), 0)} Lot)
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                Stok siap jual / pickup
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] text-text-secondary font-medium block">Kapasitas Produksi Normal</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-brand-blue font-heading">20 Lot / Hari</span>
                <span className="text-xs text-text-secondary">(500 Pcs)</span>
              </div>
              <span className="text-[10px] text-text-secondary block mt-1">
                Batas lembur maks: 24 Lot (600 Pcs)
              </span>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary font-heading">
                Daftar Batch Produksi
              </h3>
              <span className="text-xs text-text-secondary">
                Menampilkan {batches.length} batch terakhir
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-brand-blue" />
                <span>Memuat data produksi...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center text-text-secondary text-xs">
                Belum ada batch produksi yang dibuat. Klik "Buat Rencana Lot Baru" untuk memulai.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-body">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-text-secondary font-semibold">
                      <th className="py-3 px-4">Kode Batch</th>
                      <th className="py-3 px-4">Produk Dimsum</th>
                      <th className="py-3 px-4 text-center">Rencana Lot</th>
                      <th className="py-3 px-4 text-center">Hasil Aktual</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Pencatat / Catatan</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batches.map((batch) => {
                      const statusMeta = BATCH_STATUS_META[batch.status] || { label: batch.status, color: 'bg-gray-100 text-gray-700' };

                      return (
                        <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                            {batch.batch_code}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-text-primary">
                            <div>{batch.product_name || 'Dimsum'}</div>
                            <span className="text-[10px] text-gray-600 font-mono">{batch.product_sku}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-text-primary">{batch.planned_lots} Lot</span>
                            <span className="block text-[10px] text-text-secondary">({batch.planned_lots * 25} pcs)</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {batch.status === 'completed' ? (
                              <div>
                                <span className="font-bold text-emerald-700">{batch.produced_qty} Pcs</span>
                                <span className="block text-[10px] text-emerald-600">
                                  ({batch.actual_lots} Lot{batch.loose_qty > 0 ? ` + ${batch.loose_qty} ecer` : ''})
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary text-[11px]">
                            <div>Planner: <span className="font-semibold text-text-primary">{batch.creator_name || 'Admin'}</span></div>
                            {batch.checker_name && <div>QC: <span className="font-semibold text-emerald-700">{batch.checker_name}</span></div>}
                            {batch.notes && <div className="text-[10px] text-gray-600 italic mt-0.5">{batch.notes}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {batch.status === 'completed' && (
                                <button
                                  onClick={() => setSelectedStickerBatch(batch)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue/10 text-[11px] font-semibold transition-colors"
                                  title="Cetak Stiker QR Label"
                                >
                                  <Printer size={13} />
                                  <span>Cetak QR Lot</span>
                                </button>
                              )}
                              {batch.status === 'planned' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setConfirmingBatch(batch);
                                      setActualLots(batch.planned_lots);
                                      setLooseQty(0);
                                      setConfirmError('');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold transition-colors shadow-xs"
                                  >
                                    <Check size={13} />
                                    <span>QC / Konfirmasi</span>
                                  </button>
                                  <button
                                    onClick={() => handleCancelBatch(batch.id)}
                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Batalkan Rencana"
                                  >
                                    <Ban size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHECKER QUEUE (OM YOSI) */}
      {activeTab === 'checker' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-amber-900">
                Area Kerja Checker & QC Produksi (Om Yosi)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Pastikan kualitas dimsum sesuai standar ukuran (tidak terlalu kecil/peyot dan tidak kebesaran). Konfirmasi jumlah lot fisik yang selesai dan tempel stiker QR pada setiap krat.
              </p>
            </div>
          </div>

          {pendingBatches.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-text-primary">Tidak Ada Antrean Verifikasi</h4>
              <p className="text-xs text-text-secondary mt-1">
                Semua rencana produksi telah diverifikasi atau belum ada rencana baru yang dibuat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingBatches.map((batch) => (
                <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">
                          Rencana Masuk Dapur
                        </span>
                        <h4 className="font-bold text-base text-text-primary font-heading">
                          {batch.product_name}
                        </h4>
                        <span className="font-mono text-xs font-semibold text-brand-blue">
                          {batch.batch_code}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                        Target: {batch.planned_lots} Lot ({batch.planned_lots * 25} pcs)
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-text-secondary bg-gray-50 p-3 rounded-xl mb-4">
                      <div>Direncanakan oleh: <span className="font-semibold text-text-primary">{batch.creator_name || 'PPSI'}</span></div>
                      {batch.notes && <div>Catatan: <span className="italic text-gray-700">{batch.notes}</span></div>}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setConfirmingBatch(batch);
                      setActualLots(batch.planned_lots);
                      setLooseQty(0);
                      setConfirmError('');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Check size={16} />
                    <span>Verifikasi Hasil Fisik & Cetak Label</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <PlusCircle size={18} className="text-brand-blue" />
                <span>Buat Rencana Lot Produksi (PPSI)</span>
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            {planError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-body">
              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Pilih Produk Dimsum *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-semibold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok saat ini: {p.stock_qty} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Jumlah Lot Yang Diproduksi * (1 Lot = 25 Produk)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={plannedLots}
                    onChange={(e) => setPlannedLots(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-bold text-sm"
                  />
                  <span className="text-text-secondary font-medium">Lot</span>
                  <div className="ml-auto px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
                    = {Number(plannedLots || 0) * 25} Produk/Mika
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Kategori / Alasan Produksi *
                </label>
                <select
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                >
                  <option value="Produksi Harian Reguler">Produksi Harian Reguler</option>
                  <option value="Lembur: Menjaga Buffer Stock Freezer">Lembur: Menjaga Buffer Stock Freezer (Stok Aman)</option>
                  <option value="Lembur: Pemenuhan Order PO B2B">Lembur: Pemenuhan Order PO B2B / Partai Besar</option>
                  <option value="Lembur: Stok Campaign TikTok & Shopee">Lembur: Stok Campaign TikTok & Shopee</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 text-[11px] text-text-secondary">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Sparkles size={13} className="text-brand-gold" />
                  <span>Prinsip Keamanan Stok:</span>
                </div>
                <p>
                  Stok freezer baru akan bertambah secara resmi setelah Om Yosi (Checker) mengonfirmasi fisik barang jadi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingPlan ? 'Membuat Rencana...' : 'Kirim Ke Dapur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECKER CONFIRMATION */}
      {confirmingBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-700" />
                <span>Verifikasi Hasil Fisik (QC Om Yosi)</span>
              </h3>
              <button
                onClick={() => setConfirmingBatch(null)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            {confirmError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            <div className="mb-4 p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="text-xs font-bold text-amber-900">{confirmingBatch.product_name}</div>
              <div className="text-[11px] font-mono text-amber-700">{confirmingBatch.batch_code}</div>
              <div className="text-[11px] text-amber-800 mt-1">
                Target Rencana: <span className="font-bold">{confirmingBatch.planned_lots} Lot</span> ({confirmingBatch.planned_lots * 25} pcs)
              </div>
            </div>

            <form onSubmit={handleConfirmActual} className="space-y-4 text-xs font-body">
              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Jumlah Lot Utuh Berhasil Dibuat (Isi 25/Lot) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  required
                  value={actualLots}
                  onChange={(e) => setActualLots(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Sisa Eceran Lepas / Di Luar Lot (Loose Pcs)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={looseQty}
                  onChange={(e) => setLooseQty(e.target.value)}
                  placeholder="0 jika pas per lot"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none font-bold text-sm"
                />
                <span className="text-[10px] text-text-secondary mt-1 block">
                  Contoh: Jika hasil adonan 105 pcs, masukkan 4 Lot + 5 loose pcs.
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Total Masuk Stok:</span>
                  <span className="text-lg font-extrabold text-emerald-900">
                    {(Number(actualLots || 0) * 25) + Number(looseQty || 0)} Produk
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                  {actualLots} Label QR Lot
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmingBatch(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingConfirm}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingConfirm ? 'Menyimpan...' : 'Konfirmasi & Masukkan Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOT STICKER PRINT */}
      {selectedStickerBatch && (
        <LotStickerModal
          batch={selectedStickerBatch}
          onClose={() => setSelectedStickerBatch(null)}
        />
      )}
    </div>
  );
}
