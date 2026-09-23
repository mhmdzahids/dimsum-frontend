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
import Pagination from '../components/ui/Pagination';
import {
  getAdminRole,
  canCreateProductionPlan,
  canVerifyProduction,
  canCancelProductionPlan
} from '../utils/adminAuth';

const BATCH_STATUS_META = {
  planned: { label: 'Menunggu Verifikasi Checker', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Selesai Produksi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

export default function AdminProduction() {
  const userRole = getAdminRole() || 'admin';
  const canPlan = canCreateProductionPlan(userRole);
  const canVerify = canVerifyProduction(userRole);
  const canCancel = canCancelProductionPlan(userRole);

  const [activeTab, setActiveTab] = useState(() => {
    if (!canPlan && canVerify) return 'checker';
    return 'planner';
  });
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
        setSuccessMsg(`Rencana ${res.data.batch_code} berhasil dibuat.`);
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

    const parsedLoose = looseQty === '' ? 0 : Number(looseQty);
    if (parsedLoose > 24) {
      setConfirmError('Sisa eceran lepas maksimal 24 pcs (25 pcs sudah dihitung sebagai 1 Lot).');
      return;
    }
    if (parsedLoose < 0) {
      setConfirmError('Sisa eceran lepas tidak boleh bernilai negatif.');
      return;
    }

    setSubmittingConfirm(true);

    try {
      const res = await api.post(`/api/inventory/production/${confirmingBatch.id}/confirm`, {
        actual_lots: Number(actualLots),
        loose_qty: parsedLoose
      }, { auth: 'admin' });

      if (res.success) {
        const completedBatch = res.data;
        setSuccessMsg(`Produksi ${completedBatch.batch_code} terverifikasi — ${completedBatch.produced_qty} pcs masuk stok.`);
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

  // Helper cek apakah batch dibuat / dijadwalkan hari ini
  const isBatchToday = (batch) => {
    if (!batch) return false;
    const dateStr = batch.created_at || batch.planned_at;
    if (dateStr) {
      const d = new Date(dateStr);
      const now = new Date();
      if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      ) {
        return true;
      }
    }
    if (batch.batch_code) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayTag = `${y}${m}${day}`;
      if (batch.batch_code.includes(todayTag)) {
        return true;
      }
    }
    return false;
  };

  // 1. Antrean Menunggu QC (hanya status planned)
  const pendingLots = pendingBatches.reduce((acc, b) => acc + (b.planned_lots || 0), 0);
  const pendingPcs = pendingLots * 25;

  // Batches hari ini
  const todayBatches = batches.filter(isBatchToday);

  // 2. Hasil Produksi Hari Ini (completed hari ini)
  const todayCompletedBatches = todayBatches.filter(b => b.status === 'completed');
  const todayProducedPcs = todayCompletedBatches.reduce((acc, b) => acc + (b.produced_qty || 0), 0);
  const todayProducedLots = todayCompletedBatches.reduce((acc, b) => acc + (b.actual_lots || 0), 0);

  // Total stok di freezer saat ini (seluruh batch / saldo berjalan)
  const totalFreezerPcs = products && products.length > 0
    ? products.reduce((acc, p) => acc + (p.stock_qty || 0), 0)
    : batches.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.produced_qty || 0), 0);
  const totalFreezerLots = Math.floor(totalFreezerPcs / 25);

  // 3. Kapasitas Produksi Hari Ini (batch planned + completed hari ini)
  const NORMAL_CAPACITY_LOTS = 20;
  const MAX_CAPACITY_LOTS = 24;

  const todayTotalLots = todayBatches
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, b) => {
      const lotVal = b.status === 'completed' ? (b.actual_lots || b.planned_lots || 0) : (b.planned_lots || 0);
      return acc + lotVal;
    }, 0);

  const capacityPercentage = Math.round((todayTotalLots / NORMAL_CAPACITY_LOTS) * 100);
  const progressWidth = Math.min(100, Math.round((todayTotalLots / NORMAL_CAPACITY_LOTS) * 100));

  let capacityTheme = {
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    statusLabel: 'Kapasitas Normal'
  };

  if (todayTotalLots > NORMAL_CAPACITY_LOTS) {
    capacityTheme = {
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      statusLabel: todayTotalLots >= MAX_CAPACITY_LOTS ? 'Kapasitas Penuh' : 'Zona Lembur'
    };
  } else if (todayTotalLots >= 17) {
    capacityTheme = {
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      statusLabel: 'Mendekati Batas'
    };
  }

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

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 mb-6 pb-2">
        <div className="flex items-center gap-2">
          {canPlan && (
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'planner'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
                }`}
            >
              <FileText size={15} />
              <span>Rencana ({batches.length})</span>
            </button>
          )}
          {canVerify && (
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors relative ${activeTab === 'checker'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
                }`}
            >
              <ShieldCheck size={15} />
              <span>Verifikasi</span>
              {pendingBatches.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                  {pendingBatches.length}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 bg-white text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {canPlan && (
            <button
              onClick={() => { setShowPlanModal(true); setPlanError(''); }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle size={15} />
              <span>Rencana Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: PLANNER & BATCH LIST */}
      {activeTab === 'planner' && canPlan && (
        <div className="space-y-6">
          {/* Top 3 KPI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Metric 1: Antrean Menunggu QC */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all flex flex-col justify-between ${
              pendingLots > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Antrean Menunggu QC
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  pendingLots > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className={`text-xl sm:text-3xl font-extrabold font-heading ${
                  pendingLots > 0 ? 'text-amber-700' : 'text-text-primary'
                }`}>
                  {pendingLots}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">Lot</span>
                </div>
                <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-text-secondary">
                  {pendingLots > 0 ? (
                    <>
                      <span className="font-semibold text-amber-700">~{pendingPcs} pcs</span>
                      <span>• {pendingBatches.length} batch dapur</span>
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>Semua batch lolos QC</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metric 2: Hasil Produksi Hari Ini */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Produksi Selesai (Hari Ini)
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  todayProducedLots > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Factory size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className={`text-xl sm:text-3xl font-extrabold font-heading ${
                  todayProducedPcs > 0 ? 'text-emerald-700' : 'text-text-primary'
                }`}>
                  {todayProducedPcs}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">pcs</span>
                </div>
                <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-text-secondary">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span>{todayProducedLots} Lot lolos QC</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>Total freezer: {totalFreezerPcs} pcs</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Kapasitas Produksi Hari Ini */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all flex flex-col justify-between ${
              todayTotalLots > NORMAL_CAPACITY_LOTS ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Kapasitas Produksi Hari Ini
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  todayTotalLots > NORMAL_CAPACITY_LOTS
                    ? 'bg-rose-100 text-rose-700'
                    : todayTotalLots >= 17
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className={`text-xl sm:text-3xl font-extrabold font-heading ${
                  todayTotalLots > NORMAL_CAPACITY_LOTS
                    ? 'text-rose-700'
                    : todayTotalLots >= 17
                    ? 'text-amber-700'
                    : 'text-text-primary'
                }`}>
                  {todayTotalLots}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">
                    / {NORMAL_CAPACITY_LOTS} Lot
                  </span>
                </div>
                <div className="mt-1.5">
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${capacityTheme.barColor}`}
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-text-secondary">
                    {todayTotalLots <= NORMAL_CAPACITY_LOTS ? (
                      <span>
                        <strong className="text-text-primary">{capacityPercentage}%</strong> terpakai • sisa ruang <strong className="text-emerald-700">{NORMAL_CAPACITY_LOTS - todayTotalLots} Lot</strong>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-medium">
                        Zona lembur (+{todayTotalLots - NORMAL_CAPACITY_LOTS} Lot) • sisa {MAX_CAPACITY_LOTS - todayTotalLots} Lot maks
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading">
                Daftar Batch Produksi
              </h3>
              <span className="text-xs text-text-secondary">
                {batches.length} batch tercatat
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
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-body">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-text-secondary font-semibold">
                        <th className="py-3 px-4">Kode Batch</th>
                        <th className="py-3 px-4">Produk Dimsum</th>
                        <th className="py-3 px-4 text-center">Rencana Lot</th>
                        <th className="py-3 px-4 text-center">Hasil Akhir</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Pencatat / Catatan</th>
                        <th className="py-3 px-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batches
                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                        .map((batch) => {
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
                                      <span>Cetak QR</span>
                                    </button>
                                  )}
                                  {batch.status === 'planned' && (
                                    <>
                                      {canVerify && (
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
                                      )}
                                      {canCancel && (
                                        <button
                                          onClick={() => handleCancelBatch(batch.id)}
                                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Batalkan Rencana"
                                        >
                                          <Ban size={14} />
                                        </button>
                                      )}
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

                {/* Pagination footer */}
                {batches.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={batches.length}
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
      )}

      {/* TAB 2: CHECKER QUEUE (OM YOSI) */}
      {activeTab === 'checker' && canVerify && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
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
      {showPlanModal && canPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <PlusCircle size={18} className="text-brand-blue" />
                <span>Rencana Produksi Stok</span>
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
                  Pilih Varian Produk
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
                  Jumlah Lot Yang Diproduksi (1 Lot = 25 Produk)
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
                  Kategori / Alasan Produksi
                </label>
                <select
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                >
                  <option value="Produksi Harian Reguler">Produksi Rutin Harian</option>
                  <option value="Lembur: Menjaga Buffer Stock Freezer">Tambah Stok Cadangan di Freezer</option>
                  <option value="Lembur: Pemenuhan Order PO B2B">Penuhi Pesanan Borongan</option>
                  <option value="Lembur: Stok Campaign TikTok & Shopee">Stok untuk Promo TikTok & Shopee</option>
                </select>
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
      {confirmingBatch && canVerify && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-700" />
                <span>Verifikasi Hasil</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-text-primary font-semibold">
                    Sisa Eceran Lepas / Di Luar Lot (Loose Pcs)
                  </label>
                  <span className={`text-[10px] font-bold ${Number(looseQty || 0) > 24 ? 'text-amber-700' : 'text-text-secondary'}`}>
                    Maks. 24 Pcs
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={looseQty}
                  onChange={(e) => {
                    setLooseQty(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  placeholder="0 jika pas per lot"
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-bold text-sm transition-all ${Number(looseQty || 0) > 24
                    ? 'border-amber-500 bg-amber-50/30 text-amber-950 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                    : Number(looseQty || 0) < 0
                      ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                      : 'border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700'
                    }`}
                />

                {Number(looseQty || 0) > 24 ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] animate-fadeIn space-y-2">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        Sisa eceran tidak boleh lebih dari <strong>24 pcs</strong> (karena setiap <strong>25 pcs</strong> sudah terhitung <strong>1 Lot utuh</strong>).
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[10px] text-amber-800">
                        Saran: {Number(looseQty)} pcs = +{Math.floor(Number(looseQty) / 25)} Lot utuh & {Number(looseQty) % 25} sisa eceran.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(looseQty);
                          const extraLots = Math.floor(val / 25);
                          const remainder = val % 25;
                          setActualLots(prev => Math.max(0, Number(prev || 0) + extraLots));
                          setLooseQty(remainder);
                        }}
                        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[10px] shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        Sesuaikan Otomatis
                      </button>
                    </div>
                  </div>
                ) : Number(looseQty || 0) < 0 ? (
                  <span className="text-[10px] text-red-600 font-semibold mt-1 block">
                    Sisa eceran tidak boleh bernilai negatif.
                  </span>
                ) : (
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    Contoh: Jika hasil adonan 105 pcs, masukkan 4 Lot + 5 loose pcs.
                  </span>
                )}
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
                  disabled={submittingConfirm || Number(looseQty || 0) > 24 || Number(looseQty || 0) < 0}
                  title={Number(looseQty || 0) > 24 ? 'Perbaiki sisa eceran (maksimal 24) sebelum konfirmasi' : ''}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
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
