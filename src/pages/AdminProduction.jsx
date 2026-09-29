import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Edit3,
  Sliders,
  Scale,
  ShoppingBag,
  Video,
  Store,
  Briefcase,
  AlertTriangle,
  FlameKindling,
  Boxes
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
    return 'weekly'; // Default to Weekly Plan (Lala)
  });

  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Weekly Planning State (Lala)
  const [weeklyData, setWeeklyData] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [editingDayPlan, setEditingDayPlan] = useState(null);
  const [editDayForm, setEditDayForm] = useState({
    plan_date: '',
    day_of_week: '',
    target_mika: 350,
    target_vakum: 100,
    target_shopee: 150,
    target_tiktok: 100,
    target_offline: 150,
    target_po_b2b: 50,
    notes: ''
  });
  const [submittingDayPlan, setSubmittingDayPlan] = useState(false);
  const [generatingPlanId, setGeneratingPlanId] = useState(null);

  // Plan Modal State (Single Batch)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [plannedLots, setPlannedLots] = useState(350);
  const [planNotes, setPlanNotes] = useState('Produksi Harian Reguler');
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Checker Confirm Modal State (Om Yosi)
  const [confirmingBatch, setConfirmingBatch] = useState(null);
  const [actualLots, setActualLots] = useState(1);
  const [looseQty, setLooseQty] = useState(0);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Print Sticker Modal State
  const [selectedStickerBatch, setSelectedStickerBatch] = useState(null);
  const [lastConfirmedBatch, setLastConfirmedBatch] = useState(null);

  // P1 Production Lot Status (Dapur Adonan Feedback Loop)
  const [p1TodayLot, setP1TodayLot] = useState(null);
  const [loadingP1Lot, setLoadingP1Lot] = useState(false);

  // Fetch batches & products
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchesRes, productsRes] = await Promise.all([
        api.get('/api/inventory/batches?limit=100', { auth: 'admin' }),
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

      fetchP1Status();
    } catch {
      setError('Koneksi ke server terputus');
    } finally {
      setLoading(false);
    }
  };

  const fetchP1Status = async () => {
    setLoadingP1Lot(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get('/api/inventory/raw-materials/production-log?limit=10', { auth: 'admin' });
      if (res.success && res.data?.logs) {
        const match = res.data.logs.find(l => l.tanggal === todayStr);
        setP1TodayLot(match || null);
      }
    } catch (err) {
      console.error('Failed to fetch P1 lot status', err);
    } finally {
      setLoadingP1Lot(false);
    }
  };

  // Fetch Weekly Plans (Lala)
  const fetchWeeklyPlans = async (startDate = null) => {
    setLoadingWeekly(true);
    try {
      const url = startDate
        ? `/api/inventory/production/plans/weekly?start_date=${startDate}`
        : '/api/inventory/production/plans/weekly';
      const res = await api.get(url, { auth: 'admin' });
      if (res.success) {
        setWeeklyData(res.data);
        setCurrentWeekStart(res.data.start_date);
      }
    } catch {
      // Ignore background fetch error
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWeeklyPlans();
  }, []);

  // Week navigation
  const handleNavigateWeek = (offsetDays) => {
    if (!currentWeekStart) return;
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() + offsetDays);
    const newStr = current.toISOString().split('T')[0];
    setCurrentWeekStart(newStr);
    fetchWeeklyPlans(newStr);
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(null);
    fetchWeeklyPlans(null);
  };

  // Open Edit Day Plan Modal
  const openEditDayModal = (plan) => {
    setEditingDayPlan(plan);
    setEditDayForm({
      plan_date: plan.plan_date,
      day_of_week: plan.day_of_week,
      target_mika: plan.target_mika || 350,
      target_vakum: plan.target_vakum || 100,
      target_shopee: plan.target_shopee || 0,
      target_tiktok: plan.target_tiktok || 0,
      target_offline: plan.target_offline || 0,
      target_po_b2b: plan.target_po_b2b || 0,
      notes: plan.notes || ''
    });
  };

  // Save Day Plan
  const handleSaveDayPlan = async (e) => {
    e.preventDefault();
    setSubmittingDayPlan(true);
    try {
      const res = await api.post('/api/inventory/production/plans/daily', editDayForm, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg(`Rencana produksi untuk ${editDayForm.day_of_week} (${editDayForm.plan_date}) berhasil diperbarui!`);
        setEditingDayPlan(null);
        fetchWeeklyPlans(currentWeekStart);
      } else {
        alert(res.error || 'Gagal menyimpan rencana harian');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSubmittingDayPlan(false);
    }
  };

  // Generate batches instantly from daily plan
  const handleGenerateBatches = async (plan) => {
    if (!window.confirm(`Mulai produksi untuk ${plan.day_of_week} (${plan.plan_date})?\nTarget: ${plan.target_mika} Mika & ${plan.target_vakum} Vakum.`)) {
      return;
    }

    setGeneratingPlanId(plan.id);
    try {
      const res = await api.post(`/api/inventory/production/plans/${plan.id}/generate-batches`, {}, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg(`Batch produksi (${res.data.batches_created?.length || 2} batch) berhasil dibuat dan langsung masuk ke Antrean QC Om Yosi!`);
        fetchWeeklyPlans(currentWeekStart);
        fetchData();
        setActiveTab('checker'); // Switch to checker to let them see it
      } else {
        alert(res.error || 'Gagal membuat batch produksi');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan saat membuat batch produksi.');
    } finally {
      setGeneratingPlanId(null);
    }
  };

  // Single Batch Plan creation
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setPlanError('');
    setSubmittingPlan(true);

    try {
      const prodPackSize = selectedProduct?.pack_size || (selectedProduct?.name?.includes('50') ? 50 : 25);
      const res = await api.post('/api/inventory/production/plan', {
        product_id: selectedProductId,
        planned_lots: Number(plannedLots),
        notes: planNotes,
        lot_size: prodPackSize
      }, { auth: 'admin' });

      if (res.success) {
        setSuccessMsg(`Rencana batch ${res.data.batch_code} berhasil dibuat.`);
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

  // Checker Confirm (Om Yosi)
  const handleConfirmActual = async (e) => {
    e.preventDefault();
    if (!confirmingBatch) return;
    setConfirmError('');

    const currentLotSize = confirmingBatch?.lot_size || 25;
    const maxLoose = currentLotSize - 1;
    const parsedLoose = looseQty === '' ? 0 : Number(looseQty);
    if (parsedLoose > maxLoose) {
      setConfirmError(`Sisa eceran lepas maksimal ${maxLoose} pcs (${currentLotSize} pcs sudah dihitung sebagai 1 Pack utuh).`);
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
        setSuccessMsg(`Produksi ${completedBatch.batch_code} terverifikasi — ${completedBatch.actual_lots || completedBatch.produced_qty} pack (${completedBatch.total_pieces || completedBatch.produced_qty} butir) masuk stok siap jual.`);
        setLastConfirmedBatch(completedBatch);
        setConfirmingBatch(null);
        fetchData();
        fetchWeeklyPlans(currentWeekStart);
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
  const completedBatches = batches.filter(b => b.status === 'completed');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Helper date
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

  // Metrics
  const pendingPacks = pendingBatches.reduce((acc, b) => acc + (b.planned_lots || 0), 0);
  const pendingPcs = pendingBatches.reduce((acc, b) => acc + ((b.planned_lots || 0) * (b.lot_size || 25)), 0);

  const todayBatches = batches.filter(isBatchToday);
  const todayCompletedBatches = todayBatches.filter(b => b.status === 'completed');
  const todayProducedPacks = todayCompletedBatches.reduce((acc, b) => acc + (b.actual_lots || b.produced_qty || 0), 0);
  const todayProducedPcs = todayCompletedBatches.reduce((acc, b) => acc + (b.total_pieces || ((b.actual_lots || 0) * (b.lot_size || 25)) + (b.loose_qty || 0)), 0);

  const totalFreezerPacks = products && products.length > 0
    ? products.reduce((acc, p) => acc + (p.stock_qty || 0), 0)
    : batches.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.actual_lots || b.produced_qty || 0), 0);

  const NORMAL_CAPACITY_PACKS = 450;
  const MAX_CAPACITY_PACKS = 520;
  const todayTotalPacks = todayBatches
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, b) => {
      const packVal = b.status === 'completed' ? (b.actual_lots || b.planned_lots || 0) : (b.planned_lots || 0);
      return acc + packVal;
    }, 0);

  const capacityPercentage = Math.round((todayTotalPacks / NORMAL_CAPACITY_PACKS) * 100);
  const progressWidth = Math.min(100, Math.round((todayTotalPacks / NORMAL_CAPACITY_PACKS) * 100));

  let capacityTheme = {
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    statusLabel: 'Kapasitas Normal'
  };

  if (todayTotalPacks > NORMAL_CAPACITY_PACKS) {
    capacityTheme = {
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      statusLabel: todayTotalPacks >= MAX_CAPACITY_PACKS ? 'Kapasitas Penuh' : 'Zona Lembur'
    };
  } else if (todayTotalPacks >= 380) {
    capacityTheme = {
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      statusLabel: 'Mendekati Batas'
    };
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastConfirmedBatch && (
              <button
                onClick={() => setSelectedStickerBatch(lastConfirmedBatch)}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode size={13} />
                <span>Buka Stiker QR Lagi</span>
              </button>
            )}
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
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
        <div className="flex items-center gap-2 flex-wrap">
          {canPlan && (
            <>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
                }`}
              >
                <Calendar size={15} />
                <span>Rencana Mingguan (Lala)</span>
              </button>

              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'planner'
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
                }`}
              >
                <FileText size={15} />
                <span>Daftar Batch Kemas ({batches.length})</span>
              </button>
            </>
          )}

          {canVerify && (
            <>
              <button
                onClick={() => setActiveTab('checker')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                  activeTab === 'checker'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary bg-white border border-gray-200'
                }`}
              >
                <ShieldCheck size={15} />
                <span>Antrean QC (Om Yosi)</span>
                {pendingBatches.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                    {pendingBatches.length}
                  </span>
                )}
              </button>

              <Link
                to="/admin/qc-history"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-xs"
              >
                <CheckCircle2 size={15} className="text-amber-700" />
                <span>Riwayat Selesai QC ({completedBatches.length})</span>
                <ArrowRight size={13} className="text-amber-600" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => {
              fetchData();
              fetchWeeklyPlans(currentWeekStart);
            }}
            disabled={loading || loadingWeekly}
            className="p-2 rounded-xl border border-gray-200 bg-white text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading || loadingWeekly ? 'animate-spin' : ''} />
          </button>
          {canPlan && (
            <button
              onClick={() => { setShowPlanModal(true); setPlanError(''); }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Rencana Batch Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Widget Status Adonan Produksi 1 (P1 Feedback Loop) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            p1TodayLot
              ? p1TodayLot.status === 'achieved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              : 'bg-blue-50 text-brand-blue'
          }`}>
            <FlameKindling className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status Produksi 1 (Dapur Adonan Hari Ini)</span>
              {p1TodayLot ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  p1TodayLot.status === 'achieved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {p1TodayLot.status === 'achieved' ? '✅ Adonan Siap Dikemas' : '⚠️ Di Bawah Target'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  ⏳ Menunggu Input Gilingan Ayu
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              {p1TodayLot ? (
                <>
                  <span className="text-base font-extrabold text-gray-900">
                    {p1TodayLot.actual_gilingan} <span className="text-xs font-normal text-gray-500">Gilingan selesai</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    (Target: {p1TodayLot.target_gilingan} Gilingan ≈ {(p1TodayLot.actual_gilingan * 15).toLocaleString('id-ID')} kg Daging)
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">
                  Target harian standar: 36 Gilingan (≈ 540 kg Daging Ayam). Menunggu pencatatan realisasi dari Dapur P1.
                </span>
              )}
            </div>
            {p1TodayLot?.notes && (
              <p className="text-[11px] text-gray-500 italic mt-0.5">
                Catatan Ayu: "{p1TodayLot.notes}"
              </p>
            )}
          </div>
        </div>

        <Link
          to="/admin/raw-materials"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-blue bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-all shrink-0 cursor-pointer"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Lihat Bahan Baku (P1)</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* TAB 0: WEEKLY PRODUCTION CALENDAR (TUGAS LALA) */}
      {activeTab === 'weekly' && canPlan && (
        <div className="space-y-6">
          {/* Week Selector Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Kalender Target Produksi Mingguan
                </h2>
                <p className="text-xs text-gray-500">
                  Rentang: {weeklyData?.start_date ? new Date(weeklyData.start_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'} s/d{' '}
                  {weeklyData?.end_date ? new Date(weeklyData.end_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigateWeek(-7)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Minggu Lalu</span>
              </button>
              <button
                onClick={handleThisWeek}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-all cursor-pointer"
              >
                Minggu Ini
              </button>
              <button
                onClick={() => handleNavigateWeek(7)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>Minggu Depan</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekly Summary Totals Grid */}
          {weeklyData?.weekly_totals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Total Target Mika (50 pcs)</div>
                <div className="mt-1 text-2xl font-bold text-brand-blue">
                  {weeklyData.weekly_totals.target_mika.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-normal text-gray-400">wadah</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  = {(weeklyData.weekly_totals.target_mika * 50).toLocaleString('id-ID')} butir dimsum
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Total Target Vakum (25 pcs)</div>
                <div className="mt-1 text-2xl font-bold text-purple-700">
                  {weeklyData.weekly_totals.target_vakum.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-normal text-gray-400">pack</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  = {(weeklyData.weekly_totals.target_vakum * 25).toLocaleString('id-ID')} butir dimsum
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Kebutuhan Gilingan Daging</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">
                  {weeklyData.weekly_totals.total_gilingan}{' '}
                  <span className="text-xs font-normal text-gray-400">gilingan</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  ≈ {(weeklyData.weekly_totals.total_gilingan * 15).toLocaleString('id-ID')} kg daging ayam
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Alokasi Demand Channel</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-semibold">
                    Shopee: {weeklyData.weekly_totals.target_shopee}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-800 text-[10px] font-semibold">
                    TikTok: {weeklyData.weekly_totals.target_tiktok}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                    Offline: {weeklyData.weekly_totals.target_offline}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-semibold">
                    B2B: {weeklyData.weekly_totals.target_po_b2b}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weeklyData?.plans?.map((plan) => {
              const isToday = plan.is_today;
              const hasDeficit = !plan.readiness?.overall_ready;
              const hasBatches = plan.batches_count > 0 || plan.batches_generated;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-blue-50/30 border-brand-blue ring-2 ring-brand-blue/20'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header: Day & Date */}
                    <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-extrabold text-gray-900">{plan.day_of_week}</span>
                          {isToday && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-brand-blue text-white uppercase tracking-wider animate-pulse">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(plan.plan_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <button
                        onClick={() => openEditDayModal(plan)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Target & Alokasi Channel"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>

                    {/* Target Quantities */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Dimsum Mika (50 pcs)
                        </span>
                        <span className="font-extrabold text-brand-blue text-sm">
                          {plan.target_mika} <span className="text-[11px] font-normal text-gray-500">wadah</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          Dimsum Vakum (25 pcs)
                        </span>
                        <span className="font-extrabold text-purple-700 text-sm">
                          {plan.target_vakum} <span className="text-[11px] font-normal text-gray-500">pack</span>
                        </span>
                      </div>
                    </div>

                    {/* Dough Conversion Pill */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 mb-3 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Kebutuhan Adonan:</span>
                        <span>{plan.total_gilingan} Gilingan</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-amber-800">
                        <span>Daging Mentah:</span>
                        <span>≈ {plan.total_gilingan * 15} kg</span>
                      </div>
                    </div>

                    {/* Raw Material Readiness Badge (Ayu) */}
                    <div className="mb-3">
                      {hasDeficit ? (
                        <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle size={13} className="text-red-600 shrink-0" />
                            <span>Gudang Kurang {plan.readiness?.shortage_count} Bahan</span>
                          </div>
                          <div className="text-[10px] text-red-700 pl-4">
                            {plan.readiness?.deficits?.map(d => `${d.name} (${d.deficit} ${d.unit})`).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Bahan Baku Gudang Siap!</span>
                        </div>
                      )}
                    </div>

                    {/* Realization Progress if Batches Exist */}
                    {hasBatches && (
                      <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px] mb-3 space-y-1">
                        <div className="flex justify-between text-gray-600 font-medium">
                          <span>Realisasi QC:</span>
                          <span className="font-bold text-emerald-700">
                            {plan.total_actual_packs} / {plan.total_target_packs} Pack
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.round((plan.total_actual_packs / (plan.total_target_packs || 1)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Channel Breakdown Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] mb-4">
                      {plan.target_shopee > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">Shopee: {plan.target_shopee}</span>}
                      {plan.target_tiktok > 0 && <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 font-semibold">TikTok: {plan.target_tiktok}</span>}
                      {plan.target_offline > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Toko: {plan.target_offline}</span>}
                      {plan.target_po_b2b > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">PO: {plan.target_po_b2b}</span>}
                    </div>
                  </div>

                  {/* Bottom Action: Trigger Production */}
                  <div>
                    {!hasBatches ? (
                      <button
                        onClick={() => handleGenerateBatches(plan)}
                        disabled={generatingPlanId === plan.id}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                          isToday
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
                        }`}
                      >
                        <Rocket size={14} className={generatingPlanId === plan.id ? 'animate-bounce' : ''} />
                        <span>{generatingPlanId === plan.id ? 'Memproses...' : 'Mulai Produksi (Generate)'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Batch Aktif Di Dapur</span>
                        </span>
                        <button
                          onClick={() => setActiveTab('checker')}
                          className="text-[11px] underline text-emerald-900 cursor-pointer"
                        >
                          Cek QC &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: PLANNER & BATCH LIST */}
      {activeTab === 'planner' && canPlan && (
        <div className="space-y-6">
          {/* Top 3 KPI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Metric 1: Antrean Menunggu QC */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all flex flex-col justify-between ${
              pendingPacks > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Antrean Menunggu QC
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  pendingPacks > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-3xl font-extrabold text-text-primary font-heading">
                  {pendingPacks}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">
                    Pack / Mika
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs text-text-secondary">
                  <span>~{pendingPcs} butir</span>
                  <span className="text-gray-300">•</span>
                  <span>{pendingBatches.length} batch</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Hasil Produksi Hari Ini */}
            <div className="p-3.5 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Hasil Produksi Hari Ini
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-3xl font-extrabold text-emerald-700 font-heading">
                  {todayProducedPacks}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">
                    Pack
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs text-text-secondary">
                  <span className="font-semibold text-emerald-800">
                    <span>~{todayProducedPcs} butir lolos QC</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>Total freezer: {totalFreezerPacks} pack</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Kapasitas Kemasan Hari Ini */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all flex flex-col justify-between ${
              todayTotalPacks > NORMAL_CAPACITY_PACKS ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">
                  Kapasitas Kemasan (Hari Ini)
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  todayTotalPacks > NORMAL_CAPACITY_PACKS
                    ? 'bg-rose-100 text-rose-700'
                    : todayTotalPacks >= 380
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className={`text-xl sm:text-3xl font-extrabold font-heading ${
                  todayTotalPacks > NORMAL_CAPACITY_PACKS
                    ? 'text-rose-700'
                    : todayTotalPacks >= 380
                    ? 'text-amber-700'
                    : 'text-text-primary'
                }`}>
                  {todayTotalPacks}
                  <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">
                    / {NORMAL_CAPACITY_PACKS} Pack
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
                    {todayTotalPacks < NORMAL_CAPACITY_PACKS ? (
                      <span>
                        <strong className="text-text-primary">{capacityPercentage}%</strong> terpakai • sisa ruang <strong className="text-emerald-700">{NORMAL_CAPACITY_PACKS - todayTotalPacks} Pack</strong>
                      </span>
                    ) : todayTotalPacks === NORMAL_CAPACITY_PACKS ? (
                      <span>
                        <strong className="text-text-primary">100%</strong> terpakai (Kapasitas normal penuh)
                      </span>
                    ) : (
                      <span className="text-rose-700 font-medium">
                        Zona lembur (+{todayTotalPacks - NORMAL_CAPACITY_PACKS} Pack)
                        {MAX_CAPACITY_PACKS - todayTotalPacks > 0 && ` • sisa ${MAX_CAPACITY_PACKS - todayTotalPacks} Pack maks`}
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
                Daftar Batch Kemasan (Mika & Vakum)
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
                Belum ada batch produksi yang dibuat. Klik "Rencana Baru" untuk memulai.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-body">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-text-secondary font-semibold">
                        <th className="py-3 px-4">Kode Batch</th>
                        <th className="py-3 px-4">Produk Kemasan</th>
                        <th className="py-3 px-4 text-center">Rencana Kemas</th>
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
                          const isMika = batch.packaging_type === 'mika' || batch.lot_size === 50 || (batch.product_name || '').toLowerCase().includes('mika');

                          return (
                            <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                                {batch.batch_code}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-text-primary">
                                <div className="flex items-center gap-1.5">
                                  <span>{batch.product_name || 'Dimsum'}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isMika ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                    {isMika ? 'Mika (Isi 50)' : 'Vakum (Isi 25)'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono">{batch.product_sku}</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="font-bold text-text-primary">{batch.planned_lots} Pack</span>
                                <span className="block text-[10px] text-text-secondary">({batch.planned_lots * (batch.lot_size || 25)} butir)</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {batch.status === 'completed' ? (
                                  <div>
                                    <span className="font-bold text-emerald-700">{batch.actual_lots || batch.produced_qty} Pack</span>
                                    <span className="block text-[10px] text-emerald-600">
                                      ({batch.total_pieces || ((batch.actual_lots || 0) * (batch.lot_size || 25))} butir{batch.loose_qty > 0 ? ` + ${batch.loose_qty} ecer` : ''})
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
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue/10 text-[11px] font-semibold transition-colors cursor-pointer"
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
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                        >
                                          <Check size={13} />
                                          <span>QC / Konfirmasi</span>
                                        </button>
                                      )}
                                      {canCancel && (
                                        <button
                                          onClick={() => handleCancelBatch(batch.id)}
                                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                Pastikan kualitas dimsum sesuai standar ukuran (Dimsum Mika isi 50 pcs / Dimsum Vakum isi 25 pcs). Konfirmasi jumlah pack fisik yang selesai dan tempel stiker QR pada setiap kemasan sebelum disimpan ke chiller/freezer.
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
              {pendingBatches.map((batch) => {
                const isMika = batch.packaging_type === 'mika' || batch.lot_size === 50 || (batch.product_name || '').toLowerCase().includes('mika');
                const packCapacity = batch.lot_size || (isMika ? 50 : 25);

                return (
                  <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">
                              Rencana Masuk Kemas
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isMika ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                              {isMika ? 'Mika 50 Pcs' : 'Vakum 25 Pcs'}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-text-primary font-heading">
                            {batch.product_name}
                          </h4>
                          <span className="font-mono text-xs font-semibold text-brand-blue">
                            {batch.batch_code}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                          Target: {batch.planned_lots} Pack ({batch.planned_lots * packCapacity} butir)
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-text-secondary bg-gray-50 p-3 rounded-xl mb-4">
                        <div>Direncanakan oleh: <span className="font-semibold text-text-primary">{batch.creator_name || 'PPSI (Lala/Ayu)'}</span></div>
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
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Check size={16} />
                      <span>Verifikasi Hasil Fisik & Cetak Label</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT DAILY PLAN & DEMAND CHANNELS (LALA) */}
      {editingDayPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sliders size={18} className="text-brand-blue" />
                  <span>Target Produksi {editDayForm.day_of_week}</span>
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  Tanggal: {editDayForm.plan_date}
                </span>
              </div>
              <button
                onClick={() => setEditingDayPlan(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDayPlan} className="space-y-4 text-xs font-body">
              {/* Target Mika & Vakum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Target Dimsum Mika (Isi 50)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      required
                      value={editDayForm.target_mika}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_mika: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-brand-blue focus:bg-white focus:ring-1 focus:ring-brand-blue outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">Wadah</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Target Dimsum Vakum (Isi 25)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      required
                      value={editDayForm.target_vakum}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_vakum: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-purple-700 focus:bg-white focus:ring-1 focus:ring-purple-700 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">Pack</span>
                  </div>
                </div>
              </div>

              {/* Demand Channels Breakdown */}
              <div className="pt-2">
                <label className="block text-gray-700 font-bold uppercase tracking-wider text-[11px] mb-2">
                  Alokasi Estimasi Pesanan / Demand Channel (Pack)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-orange-800 font-semibold block mb-0.5">Shopee</span>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_shopee}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_shopee: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-pink-800 font-semibold block mb-0.5">TikTok</span>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_tiktok}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_tiktok: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-semibold block mb-0.5">Toko Offline</span>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_offline}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_offline: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-800 font-semibold block mb-0.5">PO / B2B</span>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_po_b2b}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_po_b2b: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-sm">
                  <span>Estimasi Total Gilingan:</span>
                  <span>
                    {(
                      ((editDayForm.target_mika / 350.0) * 30.0) +
                      ((editDayForm.target_vakum / 100.0) * 6.0)
                    ).toFixed(1)}{' '}
                    Gilingan
                  </span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Daging Ayam Mentah (15 kg/gilingan):</span>
                  <span className="font-semibold">
                    {(
                      (((editDayForm.target_mika / 350.0) * 30.0) +
                      ((editDayForm.target_vakum / 100.0) * 6.0)) * 15
                    ).toFixed(0)}{' '}
                    kg
                  </span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Total Kemasan Jadi:</span>
                  <span>{editDayForm.target_mika + editDayForm.target_vakum} Pack</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Catatan Khusus (Event / Pesanan Tertentu)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pesanan borongan MBG 50 mika diambil siang"
                  value={editDayForm.notes}
                  onChange={(e) => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingDayPlan(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDayPlan}
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingDayPlan ? 'Menyimpan...' : 'Simpan Rencana Harian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE SINGLE BATCH (MANUAL) */}
      {showPlanModal && canPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <PlusCircle size={18} className="text-brand-blue" />
                <span>Rencana Batch Manual (Produksi 2)</span>
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-text-secondary hover:text-text-primary p-1 cursor-pointer"
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
                  Pilih Produk Jadi (Mika / Vakum)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-semibold cursor-pointer"
                >
                  {products.map(p => {
                    const isMika = (p.sku || '').includes('MIKA') || (p.name || '').toLowerCase().includes('mika');
                    const packSize = p.pack_size || (isMika ? 50 : 25);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — [Isi {packSize} Pcs] (Stok: {p.stock_qty} pack)
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                  <span className="text-[11px] text-blue-900 font-medium">Format Kemasan:</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800">
                    {selectedProduct.pack_size === 50 || (selectedProduct.name || '').includes('50') || (selectedProduct.sku || '').includes('MIKA')
                      ? 'Wadah Mika (50 butir/mika)'
                      : 'Pack Vakum (25 butir/pack)'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Jumlah Kemasan Yang Diproduksi (Pack / Mika)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={plannedLots}
                    onChange={(e) => setPlannedLots(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-bold text-sm"
                  />
                  <span className="text-text-secondary font-medium">Pack</span>
                  <div className="ml-auto px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
                    = {Number(plannedLots || 0) * (selectedProduct?.pack_size || (selectedProduct?.name?.includes('50') ? 50 : 25))} Butir Dimsum
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
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none cursor-pointer"
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
                  className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingPlan ? 'Membuat Rencana...' : 'Kirim Ke Bagian Kemas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHECKER CONFIRMATION (OM YOSI) */}
      {confirmingBatch && canVerify && (() => {
        const isMika = confirmingBatch.packaging_type === 'mika' || confirmingBatch.lot_size === 50 || (confirmingBatch.product_name || '').toLowerCase().includes('mika');
        const packSize = confirmingBatch.lot_size || (isMika ? 50 : 25);
        const maxLoose = packSize - 1;

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-700" />
                  <span>Verifikasi Hasil Fisik Kemasan</span>
                </h3>
                <button
                  onClick={() => setConfirmingBatch(null)}
                  className="text-text-secondary hover:text-text-primary p-1 cursor-pointer"
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
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-amber-900">{confirmingBatch.product_name}</div>
                    <div className="text-[11px] font-mono text-amber-700">{confirmingBatch.batch_code}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMika ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {isMika ? 'Mika (50 Pcs)' : 'Vakum (25 Pcs)'}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  Target Rencana: <span className="font-bold">{confirmingBatch.planned_lots} Pack</span> ({confirmingBatch.planned_lots * packSize} butir)
                </div>
              </div>

              <form onSubmit={handleConfirmActual} className="space-y-4 text-xs font-body">
                <div>
                  <label className="block text-text-primary font-semibold mb-1">
                    Jumlah Pack Utuh Jadi (Isi {packSize}/Pack) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    value={actualLots}
                    onChange={(e) => setActualLots(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none font-bold text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-text-primary font-semibold">
                      Sisa Eceran Lepas / Di Luar Pack (Loose Pcs)
                    </label>
                    <span className={`text-[10px] font-bold ${Number(looseQty || 0) > maxLoose ? 'text-amber-700' : 'text-text-secondary'}`}>
                      Maks. {maxLoose} Pcs
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={maxLoose}
                    value={looseQty}
                    onChange={(e) => {
                      setLooseQty(e.target.value);
                      if (confirmError) setConfirmError('');
                    }}
                    placeholder="0 jika pas per kemasan"
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold text-sm transition-all ${Number(looseQty || 0) > maxLoose
                      ? 'border-amber-500 bg-amber-50/30 text-amber-950 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                      : Number(looseQty || 0) < 0
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                        : 'border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700'
                      }`}
                  />

                  {Number(looseQty || 0) > maxLoose ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] animate-fadeIn space-y-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          Sisa eceran tidak boleh lebih dari <strong>{maxLoose} pcs</strong> (karena setiap <strong>{packSize} pcs</strong> sudah terhitung <strong>1 Pack utuh</strong>).
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] text-amber-800">
                          Saran: {Number(looseQty)} pcs = +{Math.floor(Number(looseQty) / packSize)} Pack utuh & {Number(looseQty) % packSize} sisa eceran.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = Number(looseQty);
                            const extraPacks = Math.floor(val / packSize);
                            const remainder = val % packSize;
                            setActualLots(prev => Math.max(0, Number(prev || 0) + extraPacks));
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
                      Contoh: Jika hasil adonan 105 pcs ({isMika ? 'Mika isi 50' : 'Vakum isi 25'}), masukkan {Math.floor(105 / packSize)} Pack + {105 % packSize} loose pcs.
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Total Masuk Stok Siap Jual:</span>
                    <span className="text-lg font-extrabold text-emerald-900">
                      {actualLots} Pack <span className="text-xs font-normal text-emerald-700">({(Number(actualLots || 0) * packSize) + Number(looseQty || 0)} butir total)</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    {actualLots} Label QR
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setConfirmingBatch(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConfirm || Number(looseQty || 0) > maxLoose || Number(looseQty || 0) < 0}
                    title={Number(looseQty || 0) > maxLoose ? `Perbaiki sisa eceran (maksimal ${maxLoose}) sebelum konfirmasi` : ''}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {submittingConfirm ? 'Menyimpan...' : 'Konfirmasi & Masukkan Stok'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: LOT STICKER PRINT */}
      {selectedStickerBatch && (
        <LotStickerModal
          batch={selectedStickerBatch}
          onClose={() => setSelectedStickerBatch(null)}
        />
      )}
    </div>
  );
}
