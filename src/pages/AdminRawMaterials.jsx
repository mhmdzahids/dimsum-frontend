import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Sparkles,
  Sliders,
  Scale,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  Edit2,
  History,
  Info,
  FlameKindling,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  Send,
  PackageCheck
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';
import { getAdminRole, canManageRawMaterials } from '../utils/adminAuth';

const CATEGORY_MAP = {
  meat: { label: 'Daging & Unggas', badge: 'bg-red-50 text-red-700 border-red-200' },
  skin: { label: 'Kulit Dimsum', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  seasoning: { label: 'Bumbu & Minyak', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  flour: { label: 'Tepung & Pati', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  packaging: { label: 'Kemasan & Saos', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: 'Lainnya', badge: 'bg-gray-50 text-gray-700 border-gray-200' }
};

export default function AdminRawMaterials() {
  const userRole = getAdminRole() || 'admin';
  const canManage = canManageRawMaterials(userRole);

  const [materials, setMaterials] = useState([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, safe: 0 });
  const [transactions, setTransactions] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [targetGilingan, setTargetGilingan] = useState(36);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'readiness' | 'lot-log' | 'weekly' | 'history'

  // Production Log (Laporan Lot Harian)
  const [productionLog, setProductionLog] = useState({ logs: [], summary: {} });
  const [logLoading, setLogLoading] = useState(false);

  // P2 Summary for KPI feedback loop
  const [p2Summary, setP2Summary] = useState({
    completedMika: 0,
    completedVakum: 0,
    targetMika: 350,
    targetVakum: 100
  });

  // Weekly Planning Data (from P2)
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);

  // Modal: Catat Gilingan Hari Ini
  const [showGilinganModal, setShowGilinganModal] = useState(false);
  const [gilinganForm, setGilinganForm] = useState({ jumlah: 36, notes: '', tanggal: new Date().toISOString().split('T')[0] });
  const [gilinganSubmitting, setGilinganSubmitting] = useState(false);
  const [gilinganPreview, setGilinganPreview] = useState(null);

  // Checklist H-1 submit state
  const [checklistNotes, setChecklistNotes] = useState('');
  const [checklistSubmitting, setChecklistSubmitting] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState(null);

  // Physical Verification Checklist State (Papan BC Digital Ayu)
  const [checkedPhysicalItems, setCheckedPhysicalItems] = useState({});

  // Edit Day Plan Modal State in P1 (Rencana Mingguan Interaktif)
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState('in'); // 'in' | 'out'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [txQty, setTxQty] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Add/Edit Material Modal
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [matForm, setMatForm] = useState({
    code: '',
    name: '',
    category: 'meat',
    unit: 'kg',
    current_stock: 0,
    minimum_stock: 10,
    safety_stock: 25,
    notes: ''
  });
  const [matSubmitting, setMatSubmitting] = useState(false);

  // Fetch materials & summary
  const fetchMaterials = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [matRes, readRes, txRes] = await Promise.all([
        api.get('/api/inventory/raw-materials', { auth: 'admin' }),
        api.get(`/api/inventory/raw-materials/readiness?target_gilingan=${targetGilingan}`, { auth: 'admin' }),
        api.get('/api/inventory/raw-materials/transactions?limit=25', { auth: 'admin' })
      ]);

      if (matRes.success) {
        setMaterials(matRes.data?.materials || []);
        setCounts(matRes.data?.counts || { total: 0, critical: 0, warning: 0, safe: 0 });
      }

      if (readRes.success) {
        setReadiness(readRes.data);
      }

      if (txRes.success) {
        setTransactions(txRes.data?.transactions || []);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data bahan baku dari server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Production Log (Laporan Lot Harian)
  const fetchProductionLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await api.get('/api/inventory/raw-materials/production-log?limit=30', { auth: 'admin' });
      if (res.success) setProductionLog(res.data || { logs: [], summary: {} });
    } catch (err) {
      console.error('Failed to fetch production log', err);
    } finally {
      setLogLoading(false);
    }
  }, []);

  // Compute BOM preview for Catat Gilingan modal
  // PENTING: harus sinkron dengan bom_deductions di backend service.py log_gilingan()
  const computeGilinganPreview = (jumlah) => {
    const j = Number(jumlah) || 0;
    const gMika = j * (30 / 36);
    const gVakum = j * (6 / 36);
    return [
      { name: 'Daging Ayam Mentah',       code: 'RM-AYAM',    qty: (j * 15).toFixed(1),          unit: 'kg' },
      { name: 'Kulit Dimsum 9cm (Mika)',   code: 'RM-KULIT-9', qty: (gMika * 3).toFixed(1),        unit: 'kg' },
      { name: 'Kulit Dimsum 10cm (Vakum)', code: 'RM-KULIT-10',qty: (gVakum * 5).toFixed(1),       unit: 'kg' },
      { name: 'Tepung Tapioka',            code: 'RM-TEPUNG',  qty: ((j / 36) * 2).toFixed(2),    unit: 'karung' },
      { name: 'Minyak Goreng & Wijen',     code: 'RM-MINYAK',  qty: (j * 1.2).toFixed(1),          unit: 'liter' },
      { name: 'Bumbu Racik Adonan',        code: 'RM-BUMBU',   qty: (j * 1.6).toFixed(1),          unit: 'kg' },
      { name: 'Saos Sambal',               code: 'RM-SAOS',    qty: ((j / 36) * 3).toFixed(2),    unit: 'dus' },
      { name: 'Topping Dimsum',            code: 'RM-TOPPING', qty: ((j / 36) * 3).toFixed(2),    unit: 'dus' },
    ];
  };

  // Re-fetch readiness when target gilingan changes
  const updateReadiness = async (gilingan) => {
    try {
      const res = await api.get(`/api/inventory/raw-materials/readiness?target_gilingan=${gilingan}`, { auth: 'admin' });
      if (res.success) {
        setReadiness(res.data);
      }
    } catch {
      // Ignore background readiness error
    }
  };

  // Fetch P2 batches for KPI feedback loop
  const fetchP2Data = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [batchesRes, weeklyRes] = await Promise.all([
        api.get('/api/inventory/batches?limit=100', { auth: 'admin' }),
        api.get('/api/inventory/production/plans/weekly', { auth: 'admin' })
      ]);

      if (batchesRes.success) {
        const todayBatches = (batchesRes.data || []).filter(b => {
          const d = (b.completed_at || b.created_at || '').substring(0, 10);
          return d === todayStr && b.status === 'completed';
        });
        const mika = todayBatches
          .filter(b => b.packaging_type === 'mika' || b.lot_size === 50)
          .reduce((sum, b) => sum + (b.actual_packs || 0), 0);
        const vakum = todayBatches
          .filter(b => b.packaging_type === 'vakum' || b.lot_size === 25)
          .reduce((sum, b) => sum + (b.actual_packs || 0), 0);

        setP2Summary(prev => ({ ...prev, completedMika: mika, completedVakum: vakum }));
      }

      if (weeklyRes.success) {
        setWeeklyData(weeklyRes.data);
        const todayPlan = weeklyRes.data?.plans?.find(p => p.is_today);
        if (todayPlan) {
          setP2Summary(prev => ({
            ...prev,
            targetMika: todayPlan.target_mika || 350,
            targetVakum: todayPlan.target_vakum || 100
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch P2 data', err);
    }
  }, []);

  // Fetch Weekly Plans (read-only view from P2)
  const fetchWeeklyPlans = useCallback(async (startDate = null) => {
    setWeeklyLoading(true);
    try {
      const url = startDate
        ? `/api/inventory/production/plans/weekly?start_date=${startDate}`
        : '/api/inventory/production/plans/weekly';
      const res = await api.get(url, { auth: 'admin' });
      if (res.success) {
        setWeeklyData(res.data);
        setCurrentWeekStart(res.data?.start_date);
      }
    } catch (err) {
      console.error('Failed to fetch weekly plans', err);
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const handleNavigateWeek = (offsetDays) => {
    if (!currentWeekStart) return;
    const curr = new Date(currentWeekStart);
    curr.setDate(curr.getDate() + offsetDays);
    const dateStr = curr.toISOString().split('T')[0];
    setCurrentWeekStart(dateStr);
    fetchWeeklyPlans(dateStr);
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(null);
    fetchWeeklyPlans();
  };

  // Plan Edit Handlers in P1 (Rencana Mingguan Interaktif)
  const handleOpenEditDayPlan = (plan) => {
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

  const handleSaveDayPlan = async (e) => {
    e.preventDefault();
    setSubmittingDayPlan(true);
    try {
      const res = await api.post('/api/inventory/production/plans/daily', editDayForm, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg(`Target produksi ${editDayForm.day_of_week} (${editDayForm.plan_date}) berhasil diperbarui!`);
        setEditingDayPlan(null);
        fetchWeeklyPlans(currentWeekStart);
        fetchP2Data();
      } else {
        alert(res.error || 'Gagal menyimpan target');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan sistem saat menyimpan target.');
    } finally {
      setSubmittingDayPlan(false);
    }
  };

  // Physical Verification Checklist Handlers (Papan BC Ayu)
  const handleTogglePhysicalCheck = (itemName) => {
    setCheckedPhysicalItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleCheckAllPhysical = () => {
    if (!readiness?.items) return;
    const allChecked = readiness.items.every(it => checkedPhysicalItems[it.name]);
    const nextState = {};
    readiness.items.forEach(it => {
      nextState[it.name] = !allChecked;
    });
    setCheckedPhysicalItems(nextState);
  };

  // Submit Catat Gilingan Hari Ini (Bulk LOT Entry)
  const handleGilinganSubmit = async (e) => {
    e.preventDefault();
    const j = parseInt(gilinganForm.jumlah, 10);
    if (!j || j <= 0) {
      alert('Jumlah gilingan harus lebih dari 0.');
      return;
    }
    setGilinganSubmitting(true);
    try {
      const res = await api.post(
        '/api/inventory/raw-materials/log-gilingan',
        {
          jumlah_gilingan: j,
          notes: gilinganForm.notes,
          tanggal: gilinganForm.tanggal
        },
        { auth: 'admin' }
      );
      if (res.success) {
        setSuccessMsg(res.message || `Berhasil mencatat realisasi ${j} gilingan & memotong stok bahan baku.`);
        setShowGilinganModal(false);
        fetchMaterials(true);
        fetchProductionLog();
        fetchP2Data();
      } else {
        alert(res.error || 'Gagal mencatat gilingan');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan sistem saat menyimpan gilingan.');
    } finally {
      setGilinganSubmitting(false);
    }
  };

  // Fetch status cek fisik terakhir hari ini (tampilkan "Terakhir dicek oleh X")
  const fetchLatestDailyCheck = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/inventory/raw-materials/daily-check?tanggal=${todayStr}`, { auth: 'admin' });
      if (res.success && res.data?.check) {
        setLastCheckResult(res.data.check);
      }
    } catch {
      // Ignore — non-critical fetch
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
    fetchProductionLog();
    fetchP2Data();
    fetchLatestDailyCheck();

    // Auto-refresh P2 KPI setiap 5 menit agar data kemasan jadi selalu terkini
    const p2RefreshInterval = setInterval(() => {
      fetchP2Data();
    }, 5 * 60 * 1000);

    return () => clearInterval(p2RefreshInterval);
  }, [fetchProductionLog, fetchP2Data, fetchLatestDailyCheck]);

  useEffect(() => {
    if (activeTab === 'lot-log') fetchProductionLog();
    if (activeTab === 'weekly') fetchWeeklyPlans(currentWeekStart);
    if (activeTab === 'readiness') fetchLatestDailyCheck();
  }, [activeTab, fetchProductionLog, fetchWeeklyPlans, fetchLatestDailyCheck, currentWeekStart]);

  const handleTargetGilinganChange = (val) => {
    const num = Math.max(1, parseInt(val) || 1);
    setTargetGilingan(num);
    updateReadiness(num);
  };

  // Transaction Handler (IN / OUT)
  const openTransactionModal = (material, type = 'in') => {
    setSelectedMaterial(material);
    setTxType(type);
    setTxQty('');
    setTxNotes(type === 'in' ? 'Belanja Restock Supplier' : 'Pemakaian Produksi 1 (Dapur Adonan)');
    setShowTxModal(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMaterial || !txQty || Number(txQty) <= 0) {
      alert('Masukkan jumlah kuantiti yang valid');
      return;
    }

    setTxSubmitting(true);
    try {
      const res = await api.post(
        `/api/inventory/raw-materials/${selectedMaterial.id}/transaction`,
        {
          type: txType,
          quantity: Number(txQty),
          notes: txNotes
        },
        { auth: 'admin' }
      );

      if (res.success) {
        setSuccessMsg(res.message || 'Transaksi bahan baku berhasil dicatat!');
        setShowTxModal(false);
        fetchMaterials(true);
      } else {
        alert(res.error || 'Gagal menyimpan transaksi');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan sistem saat menyimpan transaksi.');
    } finally {
      setTxSubmitting(false);
    }
  };

  // Material Add / Edit Handler
  const openMaterialModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setMatForm({
        code: material.code || '',
        name: material.name || '',
        category: material.category || 'meat',
        unit: material.unit || 'kg',
        current_stock: material.current_stock || 0,
        minimum_stock: material.minimum_stock || 10,
        safety_stock: material.safety_stock || 25,
        notes: material.notes || ''
      });
    } else {
      setEditingMaterial(null);
      setMatForm({
        code: '',
        name: '',
        category: 'meat',
        unit: 'kg',
        current_stock: 0,
        minimum_stock: 10,
        safety_stock: 25,
        notes: ''
      });
    }
    setShowMaterialModal(true);
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    setMatSubmitting(true);
    try {
      let res;
      if (editingMaterial) {
        res = await api.put(`/api/inventory/raw-materials/${editingMaterial.id}`, matForm, { auth: 'admin' });
      } else {
        res = await api.post('/api/inventory/raw-materials', matForm, { auth: 'admin' });
      }

      if (res.success) {
        setSuccessMsg(res.message || 'Data bahan baku berhasil disimpan!');
        setShowMaterialModal(false);
        fetchMaterials(true);
      } else {
        alert(res.error || 'Gagal menyimpan bahan baku');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan.');
    } finally {
      setMatSubmitting(false);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.code && m.code.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && m.buffer_status !== statusFilter) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('id-ID', { maximumFractionDigits: 1 });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kontrol Bahan Baku & Kesiapan Gudang (P1)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Tugas Ayu
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring stok bahan mentah (Daging, Kulit, Minyak, Tepung) & Kalkulator Kesiapan H-1 untuk produksi gilingan harian.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchMaterials(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-blue' : ''}`} />
            Refresh
          </button>

          {canManage && (
            <>
              <button
                onClick={() => {
                  const initJ = targetGilingan || 36;
                  setGilinganForm({
                    jumlah: initJ,
                    notes: '',
                    tanggal: new Date().toISOString().split('T')[0]
                  });
                  setGilinganPreview(computeGilinganPreview(initJ));
                  setShowGilinganModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <FlameKindling className="w-4 h-4" />
                Catat Gilingan Hari Ini
              </button>

              <button
                onClick={() => {
                  if (materials.length > 0) openTransactionModal(materials[0], 'in');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Catat Restock / Belanja
              </button>

              <button
                onClick={() => {
                  if (materials.length > 0) openTransactionModal(materials[0], 'out');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <ArrowUpRight className="w-4 h-4" />
                Catat Pemakaian Produksi 1
              </button>

              <button
                onClick={() => openMaterialModal()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-brand-blue" />
                Tambah Bahan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Bahan Baku */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bahan Baku</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{counts.total}</span>
            <span className="text-xs text-gray-500 ml-2">item aktif</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Daging, Kulit, Bumbu, Minyak, Tepung</p>
        </div>

        {/* Card 2: Kesiapan H-1 Produksi */}
        <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
          readiness?.overall_status === 'SIAP'
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-amber-50/40 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Kesiapan Produksi Besok</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              readiness?.overall_status === 'SIAP' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {readiness?.overall_status === 'SIAP' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              readiness?.overall_status === 'SIAP' ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {readiness?.overall_status || 'MEMUAT...'}
            </span>
            <span className="text-xs text-gray-600 font-medium">({targetGilingan} Gilingan)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {readiness?.overall_status === 'SIAP'
              ? 'Seluruh bahan baku mencukupi untuk target besok'
              : `${readiness?.deficits?.length || 0} bahan perlu dibelanjakan segera`}
          </p>
        </div>

        {/* Card 3: Buffer Kritis & Waspada */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Stok Buffer</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div>
              <span className="text-2xl font-bold text-red-600">{counts.critical}</span>
              <span className="text-xs text-gray-500 ml-1">Kritis</span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-2xl font-bold text-amber-600">{counts.warning}</span>
              <span className="text-xs text-gray-500 ml-1">Waspada</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{counts.safe} bahan dalam status aman</p>
        </div>

        {/* Card 4: Target Harian Produksi */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Harian Produksi 1</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{targetGilingan * 15}</span>
            <span className="text-xs text-gray-500 ml-1">kg Daging Ayam</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Standar: 36 gilingan (30 Mika + 6 Vakum)</p>
        </div>

        {/* Card 5: Kemasan Jadi Hari Ini (P2 Feedback Loop) */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kemasan Jadi (P2)</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-gray-900 leading-tight">
                {p2Summary.completedMika} <span className="text-xs font-normal text-gray-400">Mika</span>
                <span className="mx-1 text-gray-300">+</span>
                {p2Summary.completedVakum} <span className="text-xs font-normal text-gray-400">Vakum</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Target: {p2Summary.targetMika} Mika, {p2Summary.targetVakum} Vakum
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <Link
              to="/admin/production"
              className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1 group"
            >
              Lihat di P2 Kemasan
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Daftar Stok Bahan Baku ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('readiness')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'readiness'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-amber-500" />
          Cek Kesiapan H-1
          {readiness?.overall_status !== 'SIAP' && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lot-log')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'lot-log'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Laporan Lot Harian
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'weekly'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Rencana Mingguan
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Bahan Baku
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau kode bahan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="all">Semua Kategori</option>
                <option value="meat">Daging & Unggas</option>
                <option value="skin">Kulit Dimsum</option>
                <option value="seasoning">Bumbu & Minyak</option>
                <option value="flour">Tepung & Pati</option>
                <option value="packaging">Kemasan & Saos</option>
                <option value="other">Lainnya</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-medium px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="all">Semua Status Buffer</option>
                <option value="critical">🔴 Kritis (Belanja Sekarang)</option>
                <option value="warning">🟡 Waspada (Mendekati Min)</option>
                <option value="safe">🟢 Aman</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Bahan Baku</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Stok Saat Ini</th>
                    <th className="px-5 py-3.5">Batas Buffer (Min / Aman)</th>
                    <th className="px-5 py-3.5">Status Buffer</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400">
                        <Boxes className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        Tidak ada data bahan baku yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedMaterials.map((mat) => {
                      const catInfo = CATEGORY_MAP[mat.category] || CATEGORY_MAP.other;
                      return (
                        <tr key={mat.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">{mat.name}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{mat.code}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catInfo.badge}`}>
                              {catInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900 text-base">
                              {formatNumber(mat.current_stock)}{' '}
                              <span className="text-xs font-normal text-gray-500">{mat.unit}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-600">
                            <div>Min: <span className="font-semibold text-red-600">{formatNumber(mat.minimum_stock)}</span> {mat.unit}</div>
                            <div>Aman: <span className="font-semibold text-emerald-600">{formatNumber(mat.safety_stock)}</span> {mat.unit}</div>
                          </td>
                          <td className="px-5 py-4">
                            {mat.buffer_status === 'critical' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                                KRITIS
                              </span>
                            )}
                            {mat.buffer_status === 'warning' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                WASPADA
                              </span>
                            )}
                            {mat.buffer_status === 'safe' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                AMAN
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => openTransactionModal(mat, 'in')}
                                    title="Catat Belanja / Restock"
                                    className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                                  >
                                    <ArrowDownLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openTransactionModal(mat, 'out')}
                                    title="Catat Pemakaian Produksi 1"
                                    className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-colors"
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openMaterialModal(mat)}
                                    title="Edit Bahan"
                                    className="p-1.5 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMaterials.length > ITEMS_PER_PAGE && (
              <div className="p-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION READINESS CALCULATOR (H-1) */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Simulator Controls Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-blue" />
                  Kalkulator Kesiapan H-1 (Target Produksi Besok)
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Berdasarkan standar hasil rapat: 36 gilingan harian (30 Mika + 6 Vakum) membutuhkan 540 kg daging ayam, 90 kg kulit 9cm, 30 kg kulit 10cm, dll.
                </p>
              </div>

              {/* Target Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase">Target Gilingan:</span>
                <div className="flex items-center gap-1.5">
                  {[24, 30, 36, 40].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleTargetGilinganChange(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetGilingan === preset
                          ? 'bg-brand-blue text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={targetGilingan}
                    onChange={(e) => handleTargetGilinganChange(e.target.value)}
                    className="w-16 px-2 py-1 text-center text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>
            </div>

            {/* Status Summary Banner */}
            <div className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              readiness?.overall_status === 'SIAP'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  readiness?.overall_status === 'SIAP' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                }`}>
                  {readiness?.overall_status === 'SIAP' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {readiness?.overall_status === 'SIAP'
                      ? 'Gudang SIAP Untuk Produksi Besok!'
                      : 'PERINGATAN: Bahan Baku Belum Cukup!'}
                  </h3>
                  <p className="text-xs text-opacity-80">
                    {readiness?.overall_status === 'SIAP'
                      ? `Semua bahan baku tersedia di gudang untuk ${targetGilingan} gilingan (${targetGilingan * 15} kg daging ayam).`
                      : `Terdapat ${readiness?.deficits?.length || 0} bahan baku yang kurang. Harus dibelanjakan hari ini sebelum shift pagi!`}
                  </p>
                </div>
              </div>

              {readiness?.overall_status !== 'SIAP' && canManage && (
                <button
                  onClick={() => {
                    const firstDeficit = readiness?.deficits?.[0];
                    const mat = materials.find(m => m.code === firstDeficit?.code);
                    if (mat) openTransactionModal(mat, 'in');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow cursor-pointer transition-all shrink-0"
                >
                  Belanja Restock Sekarang
                </button>
              )}
            </div>

            {/* Deficit Items List */}
            {readiness?.deficits && readiness.deficits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">
                  Daftar Bahan Yang Harus Dibeli ({readiness.deficits.length} Item)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {readiness.deficits.map((def, idx) => (
                    <div key={idx} className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{def.name}</div>
                        <div className="text-xs text-gray-500">
                          Stok Ada: {formatNumber(def.current_stock)} {def.unit} | Butuh: {formatNumber(def.required)} {def.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-red-600 font-semibold uppercase block">Kurang</span>
                        <span className="text-base font-extrabold text-red-700">
                          +{formatNumber(def.deficit)} {def.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill of Materials (BOM) Table */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kebutuhan Detail Standar Resep (Bill of Materials)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Centang bahan yang sudah diperiksa langsung di gudang/freezer fisik (Tugas Ayu).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const checkedCount = (readiness?.items || []).filter(item => checkedPhysicalItems[item.name]).length;
                    const totalCount = readiness?.items?.length || 0;
                    return (
                      <>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          checkedCount === totalCount && totalCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {checkedCount}/{totalCount} Fisik Dicek
                        </span>
                        <button
                          type="button"
                          onClick={handleCheckAllPhysical}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                        >
                          {checkedCount === totalCount && totalCount > 0 ? 'Batal Centang' : 'Centang Semua'}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-y border-gray-200">
                      <th className="px-3 py-3 w-10 text-center">Fisik</th>
                      <th className="px-4 py-3">Nama Bahan</th>
                      <th className="px-4 py-3">Rasio Standar Resep</th>
                      <th className="px-4 py-3">Kebutuhan ({targetGilingan} Gilingan)</th>
                      <th className="px-4 py-3">Stok Gudang</th>
                      <th className="px-4 py-3">Status Kesiapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {readiness?.items?.map((item, idx) => {
                      const isChecked = !!checkedPhysicalItems[item.name];
                      return (
                        <tr key={idx} className={`transition-colors ${
                          isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-gray-50/50'
                        }`}>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePhysicalCheck(item.name)}
                              className="w-4 h-4 rounded text-brand-blue border-gray-300 focus:ring-brand-blue cursor-pointer"
                              title="Tandai sudah dicek fisik di gudang"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isChecked && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded-full">
                                  Terverifikasi
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{item.notes}</td>
                          <td className="px-4 py-3 font-bold text-brand-blue">
                            {formatNumber(item.required)} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {formatNumber(item.current_stock)} {item.unit}
                          </td>
                          <td className="px-4 py-3">
                            {item.status === 'SIAP' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Mencukupi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                Kurang {formatNumber(item.deficit)} {item.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Cek H-1 — Checklist Digital Ayu */}
            {canManage && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4" />
                        Submit Cek Fisik Stok H-1
                      </h4>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Setelah Ayu selesai keliling cek fisik gudang, submit di sini sebagai pengganti papan checklist.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Catatan cek hari ini..."
                        value={checklistNotes}
                        onChange={e => setChecklistNotes(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl w-48 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                      <button
                        onClick={async () => {
                          setChecklistSubmitting(true);
                          try {
                            const checkedCount = (readiness?.items || []).filter(item => checkedPhysicalItems[item.name]).length;
                            const totalCount = readiness?.items?.length || 0;
                            const tanggal = new Date().toISOString().split('T')[0];
                            const fullNotes = `[Fisik: ${checkedCount}/${totalCount}] ${checklistNotes}`.trim();
                            const res = await api.post('/api/inventory/raw-materials/daily-check',
                              { tanggal, target_gilingan: targetGilingan, notes: fullNotes },
                              { auth: 'admin' });
                            if (res.success) {
                              setLastCheckResult(res.data?.check);
                              setSuccessMsg(`Cek H-1 berhasil disimpan! ${res.data?.check?.all_items_sufficient ? 'Semua bahan SIAP ✅' : `${res.data?.check?.shortage_count} bahan KURANG ⚠️`}`);
                              setChecklistNotes('');
                            }
                          } catch { /* ignore */ }
                          finally { setChecklistSubmitting(false); }
                        }}
                        disabled={checklistSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow cursor-pointer disabled:opacity-50 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {checklistSubmitting ? 'Menyimpan...' : 'Submit Cek H-1'}
                      </button>
                    </div>
                  </div>
                  {lastCheckResult && (
                    <div className="mt-3 text-xs text-blue-700 border-t border-blue-200 pt-2">
                      Terakhir dicek: <strong>{lastCheckResult.checker_name || 'Ayu'}</strong> — {lastCheckResult.tanggal} |
                      {lastCheckResult.all_items_sufficient ? ' ✅ Semua bahan mencukupi' : ` ⚠️ ${lastCheckResult.shortage_count} bahan kurang`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN LOT HARIAN (Produksi 1) */}
      {activeTab === 'lot-log' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          {productionLog.summary && Object.keys(productionLog.summary).length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase">Total Hari Tercatat</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{productionLog.summary.total_records || 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">30 hari terakhir</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase">Gilingan Aktual</div>
                <div className="text-2xl font-bold text-brand-blue mt-1">{productionLog.summary.total_actual_gilingan || 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">dari target {productionLog.summary.total_target_gilingan || 0}</div>
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase">Hari Tercapai</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{productionLog.summary.days_achieved || 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">dari {productionLog.summary.total_records || 0} hari</div>
              </div>
              <div className={`border rounded-2xl p-4 shadow-sm ${
                (productionLog.summary.overall_achievement_percent || 0) >= 90
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="text-xs font-semibold text-gray-500 uppercase">Pencapaian</div>
                <div className={`text-2xl font-bold mt-1 ${
                  (productionLog.summary.overall_achievement_percent || 0) >= 90 ? 'text-emerald-700' : 'text-amber-700'
                }`}>{productionLog.summary.overall_achievement_percent || 0}%</div>
                <div className="text-xs text-gray-400 mt-0.5">target gilingan tercapai</div>
              </div>
            </div>
          )}

          {/* Log Table */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-blue" />
                Riwayat Realisasi Lot Harian (Produksi 1)
              </h3>
              <button onClick={fetchProductionLog} disabled={logLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${logLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Target Gilingan</th>
                    <th className="px-5 py-3.5">Aktual Gilingan</th>
                    <th className="px-5 py-3.5">Gap</th>
                    <th className="px-5 py-3.5">Pencapaian</th>
                    <th className="px-5 py-3.5">Catatan</th>
                    <th className="px-5 py-3.5">PJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logLoading ? (
                    <tr><td colSpan="7" className="text-center py-10 text-gray-400">Memuat data...</td></tr>
                  ) : productionLog.logs?.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-10 text-gray-400">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Belum ada data lot harian. Gunakan tombol "Catat Gilingan Hari Ini" untuk mulai mencatat.
                    </td></tr>
                  ) : (
                    productionLog.logs?.map((log) => (
                      <tr key={log.id} className={`hover:bg-gray-50/50 ${
                        log.status === 'achieved' ? '' : 'bg-red-50/30'
                      }`}>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          {new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{log.target_gilingan} Gilingan</td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-900">{log.actual_gilingan}</span>
                          <span className="text-xs text-gray-400 ml-1">Gilingan</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-bold ${log.gap_gilingan >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {log.gap_gilingan >= 0 ? '+' : ''}{log.gap_gilingan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {log.status === 'achieved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Tercapai ({log.achievement_percent}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                              <AlertCircle className="w-3 h-3" /> Di bawah target ({log.achievement_percent}%)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{log.notes || '-'}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{log.creator_name || 'Ayu'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RENCANA MINGGUAN (DUPLIKASI BACA-ONLY DARI P2) */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Week Selector Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Target & Jadwal Produksi Mingguan
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    Sinkronisasi P2
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Rentang: {weeklyData?.start_date ? new Date(weeklyData.start_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'} s/d{' '}
                  {weeklyData?.end_date ? new Date(weeklyData.end_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                </p>
              </div>
            </div>

            {/* Navigation & Action Buttons */}
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
              <Link
                to="/admin/production"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all shadow-xs"
              >
                <span>Kelola di P2</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Info Banner for Ayu */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Panduan Bagian Bahan Baku (Ayu / P1):</span>
                <p className="text-blue-700 mt-0.5">
                  Rencana mingguan disusun oleh Planning/Sales (Lala). Tabel di bawah memperlihatkan estimasi kebutuhan gilingan dan daging ayam tiap harinya, sehingga Ayu dapat mempersiapkan belanja H-1 dan cek kesiapan gudang lebih awal.
                </p>
              </div>
            </div>
            <Link
              to="/admin/production"
              className="text-xs font-bold text-brand-blue hover:underline whitespace-nowrap"
            >
              Buka Halaman P2 →
            </Link>
          </div>

          {/* Weekly Summary Totals */}
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
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Estimasi Kebutuhan Gilingan</div>
                <div className="mt-1 text-2xl font-bold text-amber-700">
                  {weeklyData.weekly_totals.total_gilingan}{' '}
                  <span className="text-xs font-normal text-gray-400">gilingan</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  ≈ {(weeklyData.weekly_totals.total_gilingan * 15).toLocaleString('id-ID')} kg daging ayam mentah
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase">Distribusi Channel</div>
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
            {weeklyLoading ? (
              <div className="col-span-full py-16 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-blue" />
                Memuat data kalender mingguan...
              </div>
            ) : weeklyData?.plans?.map((plan) => {
              const isToday = plan.is_today;
              const gilingan = plan.total_gilingan || 36;
              const dagingKg = gilingan * 15;
              const hasDeficit = !plan.readiness?.overall_ready;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-blue-50/40 border-brand-blue ring-2 ring-brand-blue/20'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header: Day & Date */}
                    <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">{plan.day_of_week}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-blue text-white">
                              HARI INI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(plan.plan_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Readiness Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        plan.readiness?.overall_ready
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {plan.readiness?.overall_ready ? 'Bahan Siap ✅' : `${plan.readiness?.deficits?.length || 0} Kurang ⚠️`}
                      </span>
                    </div>

                    {/* Target P1: Gilingan & Daging */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 mb-3">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Kebutuhan Produksi 1 (Dapur)
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-extrabold text-amber-900">{gilingan} Gilingan</span>
                        <span className="text-xs font-semibold text-amber-800">≈ {dagingKg} kg Daging</span>
                      </div>
                    </div>

                    {/* Target P2 Kemasan */}
                    <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Target Mika (50 pcs):</span>
                        <span className="font-bold text-gray-900">{plan.target_mika} wadah</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Target Vakum (25 pcs):</span>
                        <span className="font-bold text-gray-900">{plan.target_vakum} pack</span>
                      </div>
                    </div>

                    {/* Deficit detail if any */}
                    {hasDeficit && plan.readiness?.deficits && (
                      <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 mb-3 space-y-0.5">
                        <div className="font-semibold">Bahan baku kurang:</div>
                        {plan.readiness.deficits.slice(0, 2).map((d, i) => (
                          <div key={i} className="truncate">• {d.name}: kurang {d.deficit} {d.unit}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions for Ayu */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        handleTargetGilinganChange(gilingan);
                        setActiveTab('readiness');
                      }}
                      className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark cursor-pointer inline-flex items-center gap-1"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Cek Kesiapan
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleOpenEditDayPlan(plan)}
                        className="text-xs font-semibold text-gray-700 hover:text-brand-blue bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-brand-blue" />
                        <span>Edit Target</span>
                      </button>
                    )}
                    <Link
                      to="/admin/production"
                      className="text-xs text-gray-400 hover:text-gray-700 inline-flex items-center gap-0.5"
                    >
                      <span>P2 Kemasan</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-brand-blue" />
              Riwayat Arus Masuk & Keluar Bahan Baku
            </h3>
            <span className="text-xs text-gray-400">25 transaksi terakhir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Bahan Baku</th>
                  <th className="px-5 py-3.5">Tipe Arus</th>
                  <th className="px-5 py-3.5">Jumlah</th>
                  <th className="px-5 py-3.5">Stok Sebelum &rarr; Sesudah</th>
                  <th className="px-5 py-3.5">Keterangan / PJ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      Belum ada riwayat transaksi bahan baku.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {tx.material_name}
                      </td>
                      <td className="px-5 py-3.5">
                        {tx.type === 'in' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            RESTOCK (IN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <ArrowUpRight className="w-3 h-3" />
                            PRODUKSI 1 (OUT)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        <span className={tx.type === 'in' ? 'text-emerald-700' : 'text-amber-700'}>
                          {tx.type === 'in' ? '+' : '-'}{formatNumber(tx.quantity)} {tx.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                        {formatNumber(tx.stock_before)} &rarr; {formatNumber(tx.stock_after)} {tx.unit}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        <div>{tx.notes || '-'}</div>
                        <div className="text-[11px] text-gray-400">Oleh: {tx.created_by_name || 'Staff'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TRANSACTION (RESTOCK / PEMAKAIAN) */}
      {showTxModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className={`p-4 text-white flex items-center justify-between ${
              txType === 'in' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                {txType === 'in' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                <h3 className="font-bold text-base">
                  {txType === 'in' ? 'Catat Restock / Belanja Bahan' : 'Catat Pemakaian Produksi 1 (Dapur)'}
                </h3>
              </div>
              <button
                onClick={() => setShowTxModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-black/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              {/* Material Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Pilih Bahan Baku
                </label>
                <select
                  value={selectedMaterial.id}
                  onChange={(e) => {
                    const mat = materials.find(m => m.id === parseInt(e.target.value));
                    if (mat) setSelectedMaterial(mat);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-blue focus:outline-none"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok Saat Ini: {formatNumber(m.current_stock)} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Jumlah Kuantiti ({selectedMaterial.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value)}
                    placeholder="Contoh: 50"
                    className="w-full pl-4 pr-16 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                    {selectedMaterial.unit}
                  </span>
                </div>
              </div>

              {/* Stock Preview */}
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Stok Sekarang:</span>
                  <span className="font-semibold">{formatNumber(selectedMaterial.current_stock)} {selectedMaterial.unit}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Perubahan ({txType === 'in' ? '+' : '-'}):</span>
                  <span className={`font-bold ${txType === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {txType === 'in' ? '+' : '-'}{formatNumber(txQty || 0)} {selectedMaterial.unit}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
                  <span>Estimasi Stok Baru:</span>
                  <span>
                    {formatNumber(
                      txType === 'in'
                        ? selectedMaterial.current_stock + (Number(txQty) || 0)
                        : Math.max(0, selectedMaterial.current_stock - (Number(txQty) || 0))
                    )}{' '}
                    {selectedMaterial.unit}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Keterangan / Nomor Nota / Petugas
                </label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Catatan belanja atau pemakaian..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow transition-all cursor-pointer disabled:opacity-50 ${
                    txType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT MATERIAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="p-4 bg-brand-blue text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                {editingMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setShowMaterialModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaterialSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kode Bahan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RAW-AYAM"
                    value={matForm.code}
                    onChange={(e) => setMatForm({ ...matForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kategori</label>
                  <select
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  >
                    <option value="meat">Daging & Unggas</option>
                    <option value="skin">Kulit Dimsum</option>
                    <option value="seasoning">Bumbu & Minyak</option>
                    <option value="flour">Tepung & Pati</option>
                    <option value="packaging">Kemasan & Saos</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Bahan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Daging Ayam Fillet Giling"
                  value={matForm.name}
                  onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Satuan (Unit)</label>
                  <input
                    type="text"
                    required
                    placeholder="kg / pack / liter"
                    value={matForm.unit}
                    onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Stok Minimum (Kritis)</label>
                  <input
                    type="number"
                    step="any"
                    value={matForm.minimum_stock}
                    onChange={(e) => setMatForm({ ...matForm, minimum_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Batas Aman (Safety)</label>
                  <input
                    type="number"
                    step="any"
                    value={matForm.safety_stock}
                    onChange={(e) => setMatForm({ ...matForm, safety_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {!editingMaterial && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Stok Awal Saat Ini</label>
                  <input
                    type="number"
                    step="any"
                    value={matForm.current_stock}
                    onChange={(e) => setMatForm({ ...matForm, current_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  value={matForm.notes}
                  onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })}
                  placeholder="Catatan standar resep atau supplier..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={matSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {matSubmitting ? 'Menyimpan...' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Gilingan Hari Ini (Bulk LOT Entry) */}
      {showGilinganModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                  <FlameKindling className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Catat Realisasi Gilingan Hari Ini</h3>
                  <p className="text-xs text-gray-500">Pencatatan Produksi 1 (P1) per-Lot / Gilingan</p>
                </div>
              </div>
              <button
                onClick={() => setShowGilinganModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGilinganSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-800">
                💡 <strong>Sistem Otomatis BOM:</strong> Menginput jumlah gilingan akan otomatis memotong stok bahan baku terkait (15 kg daging ayam, kulit mika/vakum, bumbu, minyak, dll) dalam 1 transaksi batch.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tanggal Produksi</label>
                  <input
                    type="date"
                    required
                    value={gilinganForm.tanggal}
                    onChange={(e) => setGilinganForm({ ...gilinganForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Jumlah Gilingan Aktual</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      required
                      value={gilinganForm.jumlah}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setGilinganForm({ ...gilinganForm, jumlah: val });
                        setGilinganPreview(computeGilinganPreview(val));
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-1 focus:ring-brand-blue"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Gilingan</span>
                  </div>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">Pilihan cepat:</span>
                {[30, 34, 36, 40].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setGilinganForm({ ...gilinganForm, jumlah: num });
                      setGilinganPreview(computeGilinganPreview(num));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      gilinganForm.jumlah === num
                        ? 'bg-brand-blue text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {num} Gilingan {num === 36 ? '(Standar)' : ''}
                  </button>
                ))}
              </div>

              {/* BOM Deduction Preview */}
              {gilinganPreview && gilinganPreview.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Estimasi Pemotongan Bahan Baku ({gilinganForm.jumlah} Gilingan)
                    </span>
                    <span className="text-[11px] font-semibold text-brand-blue">
                      Total Daging: {(gilinganForm.jumlah * 15).toLocaleString('id-ID')} kg
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gilinganPreview.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-gray-100 text-xs">
                        <div className="text-gray-500 truncate" title={item.name}>{item.name}</div>
                        <div className="font-bold text-gray-900 mt-0.5">
                          -{item.qty} <span className="text-[10px] font-normal text-gray-400">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Catatan / Kendala Shift</label>
                <textarea
                  rows="2"
                  value={gilinganForm.notes}
                  onChange={(e) => setGilinganForm({ ...gilinganForm, notes: e.target.value })}
                  placeholder="Contoh: Shift selesai tepat waktu, mesin giling normal, atau alasan jika target tidak tercapai..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGilinganModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gilinganSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <FlameKindling className="w-4 h-4" />
                  {gilinganSubmitting ? 'Memproses BOM...' : 'Konfirmasi & Kurangi Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Target Rencana Harian (Rencana Mingguan Interaktif P1) */}
      {editingDayPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Edit Target Produksi: {editingDayPlan.day_of_week}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tanggal: {editingDayPlan.plan_date} (Sinkronisasi Otomatis ke P2)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDayPlan(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayPlan} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Target Mika (50 pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editDayForm.target_mika}
                    onChange={(e) => setEditDayForm({ ...editDayForm, target_mika: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-brand-blue focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Target Vakum (25 pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editDayForm.target_vakum}
                    onChange={(e) => setEditDayForm({ ...editDayForm, target_vakum: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-purple-700 focus:bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Calculated P1 Needs Box */}
              {(() => {
                const totalPieces = (editDayForm.target_mika * 50) + (editDayForm.target_vakum * 25);
                const estGilingan = Math.ceil(totalPieces / 750) || 1;
                const estDaging = estGilingan * 15;
                return (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-amber-900 flex items-center justify-between">
                      <span>Estimasi Kebutuhan Produksi 1 (Dapur):</span>
                      <span className="text-amber-800 font-extrabold">{estGilingan} Gilingan</span>
                    </div>
                    <div className="flex justify-between text-amber-800">
                      <span>Total Butir Dimsum: {totalPieces.toLocaleString('id-ID')} pcs</span>
                      <span>Daging Mentah: ≈ {estDaging.toLocaleString('id-ID')} kg</span>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-gray-100 pt-3">
                <span className="block text-xs font-semibold text-gray-700 uppercase mb-2">
                  Alokasi Demand Channel Penjualan
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">Shopee (pack)</label>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_shopee}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_shopee: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">TikTok (pack)</label>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_tiktok}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_tiktok: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">Offline / Outlet (pack)</label>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_offline}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_offline: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">B2B / PO (pack)</label>
                    <input
                      type="number"
                      min="0"
                      value={editDayForm.target_po_b2b}
                      onChange={(e) => setEditDayForm({ ...editDayForm, target_po_b2b: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Catatan Target</label>
                <textarea
                  rows="2"
                  value={editDayForm.notes}
                  onChange={(e) => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                  placeholder="Catatan prioritas pesanan atau event..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingDayPlan(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDayPlan}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingDayPlan ? 'Menyimpan...' : 'Simpan Target Produksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
