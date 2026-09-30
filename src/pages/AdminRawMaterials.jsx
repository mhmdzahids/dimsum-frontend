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
  PackageCheck,
  Lock,
  PieChart,
  Plus,
  Funnel,
  NotebookPen,
  CalendarDays
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';
import { getAdminRole, canManageRawMaterials } from '../utils/adminAuth';
import { useRawMaterials, useUpsertRawMaterial, useProductionReadiness, useProductionLog, useP2Summary, useMaterialHistory } from '../hooks/useQueries';

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

  // React Query hooks for Tab 1 (Inventory CRUD)
  const { data: rawMaterialsData, isLoading, isRefetching, refetch } = useRawMaterials();
  const upsertMutation = useUpsertRawMaterial();

  const materials = rawMaterialsData?.materials || [];
  const counts = rawMaterialsData?.counts || { total: 0, critical: 0, warning: 0, safe: 0 };

  // Advanced features state (Tabs 2-5)
  const [transactions, setTransactions] = useState([]);
  const [targetGilingan, setTargetGilingan] = useState(36);
  const [isTargetSet, setIsTargetSet] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetModalInput, setTargetModalInput] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'readiness' | 'lot-log' | 'weekly' | 'history'

  // Tab 2: Production Readiness (Kesiapan H-1) - using React Query
  const { data: readiness, isLoading: readinessLoading, error: readinessError, refetch: refetchReadiness } = useProductionReadiness(targetGilingan);

  // Tab 3: Production Log (Laporan Lot Gilingan) - using React Query
  const { data: productionLog, isLoading: logLoading, error: logError, refetch: refetchProductionLog } = useProductionLog(30);

  // Weekly Planning Data (from P2)
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const {
    data: p2Data,
    isLoading: p2Loading,
    error: p2Error,
    refetch: refetchP2Data
  } = useP2Summary(currentWeekStart);

  const weeklyData = p2Data?.weeklyPlan;

  // P2 Summary for KPI feedback loop
  const p2Summary = React.useMemo(() => ({
    completedMika: p2Data?.p2?.completedMika || 0,
    completedVakum: p2Data?.p2?.completedVakum || 0,
    targetMika: p2Data?.p2?.targetMika || 350,
    targetVakum: p2Data?.p2?.targetVakum || 100
  }), [p2Data]);

  // Tab 5: Material History - using React Query
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(50);
  const [historySearch, setHistorySearch] = useState('');
  const historyLimitOptions = [25, 50, 100, 200];

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = useMaterialHistory({
    action: historyFilter,
    page: historyPage,
    limit: historyLimit
  });

  // Derive history array from data
  const materialHistory = historyData?.history || [];
  const historyPagination = historyData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 };

  const filteredHistory = materialHistory.filter(item => 
    !historySearch || 
    item.material_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.notes?.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.creator_name?.toLowerCase().includes(historySearch.toLowerCase())
  );

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
    target_online: 180,
    target_offline: 270,
    online_ratio: 40,
    notes: ''
  });
  const [submittingDayPlan, setSubmittingDayPlan] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters for Tab 1
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState('in'); // 'in' | 'out'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [txQty, setTxQty] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Add/Edit Material Modal - use Zustand
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

  // Fetch advanced features data (transactions only - readiness now uses React Query)
  const fetchAdvancedData = async () => {
    try {
      const txRes = await api.get('/api/inventory/raw-materials/transactions?limit=25', { auth: 'admin' });

      if (txRes.success) {
        const txList = Array.isArray(txRes.data)
          ? txRes.data
          : (txRes.data?.transactions || []);
        setTransactions(txList);
      }
    } catch (err) {
      console.error('Failed to fetch advanced data', err);
    }
  };

  // React Query automatically handles production log fetching

  // Compute BOM preview for Catat Gilingan modal
  const computeGilinganPreview = (jumlah) => {
    const j = Number(jumlah) || 0;
    const gMika = j * (30 / 36);
    const gVakum = j * (6 / 36);
    return [
      { name: 'Daging Ayam Mentah', code: 'RM-AYAM', qty: (j * 15).toFixed(1), unit: 'kg' },
      { name: 'Kulit Dimsum 9cm (Mika)', code: 'RM-KULIT-9', qty: (gMika * 3).toFixed(1), unit: 'kg' },
      { name: 'Kulit Dimsum 10cm (Vakum)', code: 'RM-KULIT-10', qty: (gVakum * 5).toFixed(1), unit: 'kg' },
      { name: 'Tepung Tapioka', code: 'RM-TEPUNG', qty: ((j / 36) * 2).toFixed(2), unit: 'karung' },
      { name: 'Minyak Goreng & Wijen', code: 'RM-MINYAK', qty: (j * 1.2).toFixed(1), unit: 'liter' },
      { name: 'Bumbu Racik Adonan', code: 'RM-BUMBU', qty: (j * 1.6).toFixed(1), unit: 'kg' },
      { name: 'Saos Sambal', code: 'RM-SAOS', qty: ((j / 36) * 3).toFixed(2), unit: 'dus' },
      { name: 'Topping Dimsum', code: 'RM-TOPPING', qty: ((j / 36) * 3).toFixed(2), unit: 'dus' },
    ];
  };

  // React Query automatically handles readiness fetching when targetGilingan changes

  // React Query automatically handles P2 data fetching when currentWeekStart changes

  const handleNavigateWeek = (offsetDays) => {
    if (offsetDays < 0 && !weeklyData?.can_navigate_backward) return;
    if (offsetDays > 0 && !weeklyData?.can_navigate_forward) return;
    const baseDate = currentWeekStart ? new Date(currentWeekStart) : new Date(weeklyData?.start_date || new Date());
    baseDate.setDate(baseDate.getDate() + offsetDays);
    const dateStr = baseDate.toISOString().split('T')[0];
    setCurrentWeekStart(dateStr);
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(null);
  };

  // Plan Edit Handlers in P1 (Rencana Mingguan Interaktif)
  const handleEditTargetChange = (field, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    const newMika = field === 'target_mika' ? num : (parseInt(editDayForm.target_mika) || 0);
    const newVakum = field === 'target_vakum' ? num : (parseInt(editDayForm.target_vakum) || 0);
    const total = newMika + newVakum;
    const ratio = editDayForm.online_ratio ?? 40;
    const onPacks = Math.round(total * (ratio / 100));
    const offPacks = Math.max(0, total - onPacks);
    setEditDayForm(prev => ({
      ...prev,
      [field]: num,
      target_online: onPacks,
      target_offline: offPacks
    }));
  };

  const handleEditRatioChange = (ratio) => {
    const total = (parseInt(editDayForm.target_mika) || 0) + (parseInt(editDayForm.target_vakum) || 0);
    const onPacks = Math.round(total * (ratio / 100));
    const offPacks = Math.max(0, total - onPacks);
    setEditDayForm(prev => ({
      ...prev,
      online_ratio: ratio,
      target_online: onPacks,
      target_offline: offPacks
    }));
  };

  const handleOpenEditDayPlan = (plan) => {
    if (plan.is_past) {
      alert('Rencana produksi tanggal lampau bersifat arsip dan tidak dapat diubah.');
      return;
    }
    setEditingDayPlan(plan);
    const mika = plan.target_mika || 350;
    const vakum = plan.target_vakum || 100;
    const onPacks = plan.target_online ?? 180;
    const offPacks = plan.target_offline ?? 270;
    const sumPacks = onPacks + offPacks;
    const ratio = sumPacks > 0 ? Math.round((onPacks / sumPacks) * 100) : 40;

    setEditDayForm({
      plan_date: plan.plan_date,
      day_of_week: plan.day_of_week,
      target_mika: mika,
      target_vakum: vakum,
      target_online: onPacks,
      target_offline: offPacks,
      online_ratio: ratio,
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
        // React Query auto-refetches due to staleTime config
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
          tanggal: gilinganForm.tanggal,
          force: gilinganForm.force || false
        },
        { auth: 'admin' }
      );
      if (res.success) {
        if (res.data?.has_shortage) {
          const shortageNames = (res.data?.shortage_items || [])
            .map(s => `${s.material} (kurang ${s.deficit} ${s.unit})`)
            .join(', ');
          alert(`PERHATIAN: Realisasi gilingan berhasil dicatat, namun ada bahan baku yang stok fisiknya kurang dari standar: ${shortageNames}. Stok bahan tersebut telah dihabiskan ke 0.`);
        }
        setSuccessMsg(res.message || `Berhasil mencatat realisasi ${j} gilingan & memotong stok bahan baku.`);
        setShowGilinganModal(false);
        refetch(); // React Query refetch
        refetchProductionLog();
        // P2 summary auto-refetches via refetchInterval in hook
      } else {
        alert(res.error || 'Gagal mencatat gilingan');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Terjadi kesalahan sistem saat menyimpan gilingan.';
      if (errMsg.includes('force=True') || errMsg.includes('sudah pernah dicatat')) {
        const confirmExtra = window.confirm(`${errMsg}\n\nApakah Anda ingin tetap melanjutkan pencatatan sebagai shift tambahan?`);
        if (confirmExtra) {
          try {
            const retryRes = await api.post(
              '/api/inventory/raw-materials/log-gilingan',
              {
                jumlah_gilingan: j,
                notes: gilinganForm.notes,
                tanggal: gilinganForm.tanggal,
                force: true
              },
              { auth: 'admin' }
            );
            if (retryRes.success) {
              setSuccessMsg(retryRes.message || 'Berhasil mencatat gilingan shift tambahan.');
              setShowGilinganModal(false);
              refetch();
              refetchProductionLog();
              // P2 summary auto-refetches via refetchInterval in hook
              return;
            }
          } catch (retryErr) {
            alert(retryErr.response?.data?.error || 'Gagal mencatat shift tambahan.');
          }
        }
      } else {
        alert(errMsg);
      }
    } finally {
      setGilinganSubmitting(false);
    }
  };

  // Fetch status cek fisik terakhir hari ini
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

  const handleOpenScheduleModal = async () => {
    setShowScheduleModal(true);
    setScheduleLoading(true);
    try {
      const res = await api.get('/api/settings/production-days', { auth: 'admin' });
      if (res.success && res.data?.active_production_days) {
        setActiveDays(res.data.active_production_days);
      }
    } catch {
      setActiveDays([0, 1, 2, 3, 4, 5, 6]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSubmittingSchedule(true);
    try {
      const res = await api.put('/api/settings/production-days', { active_production_days: activeDays }, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg(res.message || 'Jadwal kerja mingguan berhasil diperbarui.');
        setShowScheduleModal(false);
        // P2 summary auto-refetches via refetchInterval in hook
      } else {
        setError(res.error || 'Gagal menyimpan jadwal kerja');
      }
    } catch {
      setError('Gagal menyimpan jadwal kerja');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const toggleActiveDay = (dayIndex) => {
    if (activeDays.includes(dayIndex)) {
      setActiveDays(activeDays.filter(d => d !== dayIndex));
    } else {
      setActiveDays([...activeDays, dayIndex].sort());
    }
  };

  useEffect(() => {
    fetchAdvancedData();
    fetchLatestDailyCheck();
    // React Query's refetchInterval in useP2Summary handles auto-refresh every 5 minutes
  }, [fetchLatestDailyCheck]);

  useEffect(() => {
    // React Query handles lot-log and weekly planning fetching automatically
    if (activeTab === 'readiness') fetchLatestDailyCheck();
  }, [activeTab, fetchLatestDailyCheck]);

  const handleTargetGilinganChange = (val) => {
    const num = Math.max(1, parseInt(val) || 1);
    setTargetGilingan(num);
    setIsTargetSet(true);
    // React Query will automatically refetch when targetGilingan changes
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
        refetch(); // React Query refetch
      } else {
        alert(res.error || 'Gagal menyimpan transaksi');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan sistem saat menyimpan transaksi.');
    } finally {
      setTxSubmitting(false);
    }
  };

  // Material Add / Edit Handler with React Query
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

    try {
      await upsertMutation.mutateAsync({
        id: editingMaterial?.id,
        data: matForm
      });

      setSuccessMsg(editingMaterial ? 'Data bahan baku berhasil diperbarui!' : 'Bahan baku baru berhasil ditambahkan!');
      setShowMaterialModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan.');
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-blue mx-auto mb-3" />
          <p className="text-gray-600">Memuat data bahan baku...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
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

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto no-scrollbar mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer whitespace-nowrap ${activeTab === 'inventory'
            ? 'text-brand-blue border-b-2 border-brand-blue'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          Daftar Stok ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('readiness')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'readiness'
            ? 'text-brand-blue border-b-2 border-brand-blue'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Kontrol Stok
        </button>

        <button
          onClick={() => setActiveTab('lot-log')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'lot-log'
            ? 'text-brand-blue border-b-2 border-brand-blue'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          Laporan Lot Gilingan
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'weekly'
            ? 'text-brand-blue border-b-2 border-brand-blue'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <Calendar className="w-4 h-4" />
          Rencana Mingguan
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'history'
            ? 'text-brand-blue border-b-2 border-brand-blue'
            : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <History className="w-4 h-4" />
          Riwayat Bahan Baku
        </button>
      </div>

      {/* KPI Summary Cards */}
      {activeTab === 'lot-log' && productionLog?.summary && Object.keys(productionLog.summary).length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Hari Tercatat */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Total Hari Tercatat</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-text-primary">
                {productionLog.summary.total_records || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-text-secondary mt-1">30 hari terakhir</div>
            </div>
          </div>

          {/* Card 2: Gilingan Aktual */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Gilingan Aktual</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <FlameKindling size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-brand-blue">
                {productionLog.summary.total_actual_gilingan || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-text-secondary mt-1">dari target {productionLog.summary.total_target_gilingan || 0}</div>
            </div>
          </div>

          {/* Card 3: Hari Tercapai */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Hari Tercapai</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-emerald-600">
                {productionLog.summary.days_achieved || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-text-secondary mt-1">dari {productionLog.summary.total_records || 0} hari</div>
            </div>
          </div>

          {/* Card 4: Pencapaian */}
          {(() => {
            const pct = productionLog.summary.overall_achievement_percent || 0;
            const isGood = pct >= 90;
            return (
              <div className={`p-3.5 sm:p-5 rounded-card border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between ${isGood ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
                  <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight ${isGood ? 'text-emerald-700' : 'text-amber-700'}`}>Pencapaian</span>
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                </div>
                <div>
                  <div className={`text-xl sm:text-3xl font-black font-heading ${isGood ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {pct}%
                  </div>
                  <div className={`text-[10px] sm:text-xs mt-1 ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>target gilingan tercapai</div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : activeTab === 'weekly' && weeklyData?.weekly_totals ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Target Mika */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Target Mika (Isi 50)</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <PackageCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-brand-blue">
                {weeklyData.weekly_totals.target_mika.toLocaleString('id-ID')} <span className="text-xs sm:text-sm font-semibold text-text-secondary">wadah</span>
              </div>
            </div>
          </div>

          {/* Card 2: Target Vakum */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Target Vakum (Isi 25)</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <PackageCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-purple-700">
                {weeklyData.weekly_totals.target_vakum.toLocaleString('id-ID')} <span className="text-xs sm:text-sm font-semibold text-text-secondary">pack</span>
              </div>
            </div>
          </div>

          {/* Card 3: Kebutuhan Gilingan */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Kebutuhan Gilingan</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FlameKindling size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-amber-700">
                {weeklyData.weekly_totals.total_gilingan} <span className="text-xs sm:text-sm font-semibold text-text-secondary">gilingan</span>
              </div>
            </div>
          </div>

          {/* Card 4: Alokasi Stok */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Alokasi Stok</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center shrink-0">
                <PieChart size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            {(() => {
              const on = weeklyData.weekly_totals.target_online ?? 0;
              const off = weeklyData.weekly_totals.target_offline ?? 0;
              const sum = on + off;
              const onPct = sum > 0 ? Math.round((on / sum) * 100) : 40;
              const offPct = 100 - onPct;
              return (
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xl sm:text-3xl font-black font-heading text-brand-blue">
                      {onPct}% <span className="text-xs font-semibold text-text-secondary">Online</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="text-xl sm:text-3xl font-black font-heading text-emerald-600">
                      {offPct}% <span className="text-xs font-semibold text-text-secondary">Offline</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Bahan Baku */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Total Bahan Baku</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <Boxes size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-text-primary">
                {counts.total} <span className="text-xs sm:text-sm font-semibold text-text-secondary">Bahan</span>
              </div>
            </div>
          </div>

          {/* Card 2: Kesiapan H-1 Produksi */}
          {(() => {
            if (readinessLoading) {
              return (
                <div className="p-3.5 sm:p-5 rounded-card border border-gray-200 shadow-card bg-gray-50 animate-pulse">
                  <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Kesiapan Produksi Besok</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gray-200" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24" />
                </div>
              );
            }

            if (readinessError) {
              return (
                <div className="p-3.5 sm:p-5 rounded-card border border-red-200 shadow-card bg-red-50">
                  <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Kesiapan Produksi Besok</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                  </div>
                  <div className="text-red-600 text-sm font-semibold">Gagal memuat</div>
                </div>
              );
            }

            const isReady = readiness?.overall_status === 'SIAP' || readiness?.overall_ready === true;
            const statusText = !readiness ? 'MEMUAT...' : (isReady ? 'SIAP' : 'KURANG');

            return (
              <div className={`p-3.5 sm:p-5 rounded-card border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between ${isReady
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/40 border-amber-200'
                }`}>
                <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Kesiapan Produksi Besok</span>
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {isReady ? <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl sm:text-3xl font-black font-heading ${isReady ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                      {statusText}
                    </span>

                  </div>
                </div>
              </div>
            );
          })()}

          {/* Card 3: Buffer Kritis & Waspada */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Status Stok Buffer</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-red-100 text-brand-red flex items-center justify-center shrink-0">
                <TrendingDown size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-xl sm:text-3xl font-black font-heading text-red-600">
                  {counts.critical} <span className="text-xs font-semibold text-text-secondary">Kritis</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="text-xl sm:text-3xl font-black font-heading text-amber-600">
                  {counts.warning} <span className="text-xs font-semibold text-text-secondary">Waspada</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Target Harian Produksi */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-bg-cream-dark/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary leading-tight">Target Harian</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Scale size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-black font-heading text-text-primary">
                {targetGilingan * 15} <span className="text-xs sm:text-sm font-semibold text-text-secondary">kg Daging Ayam</span>
              </div>
            </div>
          </div>


        </div>
      )}


      {/* TAB 1: INVENTORY TABLE - MIGRATED TO REACT QUERY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Action Buttons */}


          {/* Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
              {/* Search & Sort Mobile */}
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
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
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`md:hidden w-11 h-auto flex-shrink-0 flex items-center justify-center border rounded-xl transition-colors ${showMobileFilters ? 'bg-brand-blue text-white border-brand-blue' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                >
                  <Funnel size={18} />
                </button>
              </div>

              {/* Filter Dropdowns (Desktop & Mobile if toggled) */}
              <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-2 w-full md:w-auto`}>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto text-xs font-medium px-3 py-2.5 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
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
                  className="w-full md:w-auto text-xs font-medium px-3 py-2.5 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="all">Semua Status Buffer</option>
                  <option value="critical">🔴 Kritis (Belanja Sekarang)</option>
                  <option value="warning">🟡 Waspada (Mendekati Min)</option>
                  <option value="safe">🟢 Aman</option>
                </select>

                {canManage && (
                  <button
                    onClick={() => openMaterialModal()}
                    className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tambah Bahan
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Tambah Bahan */}
            {canManage && (
              <button
                onClick={() => openMaterialModal()}
                className="md:hidden w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah Bahan
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card overflow-hidden">
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
                              {formatNumber(mat.stock_qty ?? mat.current_stock ?? 0)}{' '}
                              <span className="text-xs font-normal text-gray-500">{mat.unit}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-600">
                            <div>Min: <span className="font-semibold text-red-600">{formatNumber(mat.min_buffer ?? mat.minimum_stock ?? 0)}</span> {mat.unit}</div>
                            <div>Aman: <span className="font-semibold text-emerald-600">{formatNumber(mat.safe_target ?? mat.safety_stock ?? 0)}</span> {mat.unit}</div>
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

      {/* TAB 2: PRODUCTION READINESS (KESIAPAN H-1) - MIGRATED TO REACT QUERY */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {readinessLoading ? (
            <div className="bg-white border border-bg-cream-dark/80 rounded-card p-6 shadow-card">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-64 bg-gray-50 rounded animate-pulse" />
            </div>
          ) : readinessError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-700 font-semibold">Gagal memuat data kesiapan produksi</p>
              <button
                onClick={() => refetchReadiness()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {canManage && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      setTargetModalInput(targetGilingan.toString());
                      setShowTargetModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <NotebookPen className="w-4 h-4" />
                    {isTargetSet ? 'Edit Target' : 'Atur Target'}
                  </button>
                </div>
              )}
              <div className="bg-white border border-bg-cream-dark/80 rounded-card p-4 sm:p-6 shadow-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-bg-cream-dark/60">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-primary font-heading flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-brand-blue" />
                      Kesiapan Bahan Baku
                    </h2>
                  </div>

                  {/* Plain Text Target */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target Gilingan:</span>
                    <span className="text-sm font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg">
                      {isTargetSet ? `${targetGilingan} Gilingan` : 'Belum di tentukan'}
                    </span>
                  </div>
                </div>

                {/* Bill of Materials (BOM) Table */}
                <div className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const checkedCount = (readiness?.items || []).filter(item => checkedPhysicalItems[item.name]).length;
                        const totalCount = readiness?.items?.length || 0;
                        return (
                          <>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${checkedCount === totalCount && totalCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              {checkedCount}/{totalCount} Terpilih
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
                          const isItemReady = item.status === 'SIAP' || item.is_ready === true;
                          return (
                            <tr key={idx} className={`transition-colors ${isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-gray-50/50'
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
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">{item.notes}</td>
                              <td className="px-4 py-3 font-bold text-brand-blue">
                                {formatNumber(item.required ?? item.required_qty)} {item.unit}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {formatNumber(item.current_stock)} {item.unit}
                              </td>
                              <td className="px-4 py-3">
                                {isItemReady ? (
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

                {/* Verifikasi Fisik Harian */}
                {canManageRawMaterials && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Catatan kondisi fisik stok..."
                            value={checklistNotes}
                            onChange={e => setChecklistNotes(e.target.value)}
                            className="px-4 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue focus:bg-white transition-all shadow-inner"
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
                                  setSuccessMsg(`Verifikasi berhasil disimpan. ${res.data?.check?.all_items_sufficient ? 'Semua bahan mencukupi.' : `${res.data?.check?.shortage_count} bahan kurang.`}`);
                                  setChecklistNotes('');
                                }
                              } catch { /* ignore */ }
                              finally { setChecklistSubmitting(false); }
                            }}
                            disabled={checklistSubmitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {checklistSubmitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
                          </button>
                        </div>
                      </div>
                      {lastCheckResult && (
                        <div className="mt-3 text-xs text-text-secondary pt-2 text-right">
                          Terverifikasi oleh: <strong className="text-text-primary">{lastCheckResult.checker_name || 'Petugas Gudang'}</strong> — {lastCheckResult.tanggal} |{' '}
                          <span className={lastCheckResult.all_items_sufficient ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                            {lastCheckResult.all_items_sufficient ? 'Semua bahan mencukupi' : `${lastCheckResult.shortage_count} bahan kurang`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: LAPORAN LOT GILINGAN - React Query Migration */}
      {activeTab === 'lot-log' && (
        <div className="space-y-4">
          {/* Action Buttons */}
          {canManage && (
            <div className="flex justify-end mb-4">
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <NotebookPen className="w-4 h-4" />
                Catat Gilingan Hari Ini
              </button>
            </div>
          )}

          {/* Loading State */}
          {logLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-bg-cream-dark/80 rounded-card p-3.5 sm:p-5 shadow-card">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-2 w-20 bg-gray-100 rounded animate-pulse mt-2" />
                  </div>
                ))}
              </div>
              <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card p-6">
                <div className="h-96 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          )}

          {/* Error State */}
          {logError && !logLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-700 font-semibold">Gagal memuat laporan lot gilingan</p>
                  <p className="text-red-600 text-sm mt-1">{logError.message || 'Terjadi kesalahan saat mengambil data'}</p>
                </div>
              </div>
              <button
                onClick={() => refetchProductionLog()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* Success State */}
          {!logLoading && !logError && (
            <>


              {/* Log Table */}
              <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card overflow-hidden">
                <div className="p-4 border-b border-bg-cream-dark/60 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-blue" />
                    Riwayat Realisasi Lot Harian (Produksi 1)
                  </h3>
                  <button onClick={() => refetchProductionLog()} disabled={logLoading}
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
                      {productionLog?.logs?.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-gray-400">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            Belum ada data lot harian. Gunakan tombol "Catat Gilingan Hari Ini" untuk mulai mencatat.
                          </td>
                        </tr>
                      ) : (
                        productionLog?.logs?.map((log) => (
                          <tr key={log.id} className={`hover:bg-gray-50/50 ${log.status === 'achieved' ? '' : 'bg-red-50/30'}`}>
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
            </>
          )}
        </div>
      )}

      {/* TAB 4: Rencana Mingguan (Migrated to React Query) */}
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
                disabled={!weeklyData?.can_navigate_backward}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${!weeklyData?.can_navigate_backward
                  ? 'border-gray-200/60 text-gray-300 bg-gray-50/50 cursor-not-allowed'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
                  }`}
                title={!weeklyData?.can_navigate_backward ? 'Tidak ada data riwayat sebelum minggu ini' : 'Lihat minggu sebelumnya'}
              >
                <ChevronLeft size={14} />
                <span>Minggu Lalu</span>
              </button>
              <button
                onClick={handleThisWeek}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${!currentWeekStart || currentWeekStart === weeklyData?.current_week_start
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => handleNavigateWeek(7)}
                disabled={!weeklyData?.can_navigate_forward}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${!weeklyData?.can_navigate_forward
                  ? 'border-gray-200/60 text-gray-300 bg-gray-50/50 cursor-not-allowed'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
                  }`}
                title={!weeklyData?.can_navigate_forward ? 'Maksimal perencanaan hanya hingga 2 minggu ke depan' : 'Lihat minggu berikutnya'}
              >
                <span>Minggu Depan</span>
                <ChevronRight size={14} />
              </button>
              {canManage && (
                <button
                  onClick={handleOpenScheduleModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark transition-all cursor-pointer shadow-sm hover:shadow ml-2"
                >
                  <CalendarDays size={14} />
                  <span>Atur Hari Aktif</span>
                </button>
              )}
            </div>
          </div>



          {/* 7-Day Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {p2Loading ? (
              <div className="col-span-full py-16 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-blue" />
                Memuat data kalender mingguan...
              </div>
            ) : weeklyData?.plans?.map((plan) => {
              const isToday = plan.is_today;
              const isPast = plan.is_past;
              const isFuture = plan.is_future;
              const gilingan = plan.total_gilingan !== null && plan.total_gilingan !== undefined ? plan.total_gilingan : 36;
              const dagingKg = gilingan * 15;
              const hasDeficit = !plan.readiness?.overall_ready;

              return (
                <div
                  key={plan.id}
                  className={`rounded-card border p-3.5 sm:p-4 shadow-xs transition-all flex flex-col justify-between ${gilingan === 0
                    ? 'bg-gray-50/80 border-gray-200 opacity-80'
                    : isToday
                      ? 'bg-white border-brand-blue ring-1 ring-brand-blue/30'
                      : isPast
                        ? 'bg-[#fafaf9] border-gray-200/80 text-gray-600'
                        : 'bg-white border-bg-cream-dark/80 hover:border-gray-300'
                    }`}
                >
                  <div>
                    {/* Header: Day & Date */}
                    <div className="flex items-start justify-between mb-3 border-b border-bg-cream-dark/60 pb-2.5">
                      <div className={gilingan === 0 ? 'opacity-60' : ''}>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm sm:text-base font-heading ${isPast || gilingan === 0 ? 'font-semibold text-gray-600' : 'font-extrabold text-text-primary'}`}>
                            {plan.day_of_week}
                          </span>
                          {isToday && gilingan > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-blue text-white uppercase tracking-wider">
                              HARI INI
                            </span>
                          )}
                          {isPast && gilingan > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-200/70 text-gray-500">
                              Arsip
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(plan.plan_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Readiness Badge */}
                      {gilingan > 0 && (
                        isPast ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">
                            Tercatat
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${plan.readiness?.overall_ready
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {plan.readiness?.overall_ready ? 'Bahan Siap' : `${plan.readiness?.deficits?.length || 0} Kurang`}
                          </span>
                        )
                      )}
                    </div>

                    {gilingan === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-100/50 rounded-xl mb-3 border border-gray-200 border-dashed">
                        <CalendarDays className="w-8 h-8 mb-2 opacity-40 text-gray-400" />
                        <span className="font-bold text-sm text-gray-500">Libur Produksi</span>
                        <span className="text-xs text-gray-400">Tidak ada target</span>
                      </div>
                    ) : (
                      <>
                        {/* Target Gilingan & Daging */}
                        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 mb-3">
                          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                            Kebutuhan Gilingan
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-base font-extrabold text-amber-900">{gilingan} Gilingan</span>
                            <span className="text-xs font-semibold text-amber-800">≈ {dagingKg} kg Daging</span>
                          </div>
                        </div>

                        {/* Target Kemasan */}
                        <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Mika (Isi 50):</span>
                            <span className="font-bold text-gray-900">{plan.target_mika} wadah</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Vakum (Isi 25):</span>
                            <span className="font-bold text-gray-900">{plan.target_vakum} pack</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Deficit detail if any */}
                    {gilingan > 0 && !isPast && hasDeficit && plan.readiness?.deficits && (
                      <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 mb-3 space-y-0.5">
                        <div className="font-semibold">Bahan baku kurang:</div>
                        {plan.readiness.deficits.slice(0, 2).map((d, i) => (
                          <div key={i} className="truncate">• {d.name}: kurang {d.deficit} {d.unit}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                    {!isPast && gilingan > 0 ? (
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
                    ) : isPast ? (
                      <span className="text-xs text-gray-400 font-medium inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Selesai
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium inline-flex items-center gap-1">
                        Libur
                      </span>
                    )}

                    {canManage && (
                      isPast ? (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 inline-flex items-center gap-1 cursor-not-allowed" title="Arsip - target tidak dapat diubah">
                          <Lock className="w-3 h-3 text-gray-400" />
                          <span>Terkunci</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenEditDayPlan(plan)}
                          className="text-xs font-semibold text-gray-700 hover:text-brand-blue bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-brand-blue" />
                          <span>Edit Target</span>
                        </button>
                      )
                    )}

                    <Link
                      to="/admin/production"
                      className="text-xs text-gray-400 hover:text-gray-700 inline-flex items-center gap-0.5 ml-auto"
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


      {/* TAB 5: Riwayat Bahan Baku */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setHistoryFilter('all');
                setHistoryPage(1); // Reset to page 1 when filter changes
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${historyFilter === 'all' ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => {
                setHistoryFilter('in');
                setHistoryPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${historyFilter === 'in' ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Stock In
            </button>
            <button
              onClick={() => {
                setHistoryFilter('out');
                setHistoryPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${historyFilter === 'out' ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Stock Out
            </button>
            <button
              onClick={() => {
                setHistoryFilter('adjustment');
                setHistoryPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${historyFilter === 'adjustment' ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Adjustment
            </button>
          </div>

          {/* Loading State */}
          {historyLoading && (
            <div className="bg-white border border-bg-cream-dark/80 rounded-card shadow-card p-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {historyError && !historyLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-700 font-semibold">Gagal memuat riwayat bahan baku</p>
                  <p className="text-red-600 text-sm mt-1">{historyError.message || 'Terjadi kesalahan saat mengambil data'}</p>
                </div>
              </div>
              <button
                onClick={() => refetchHistory()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* Success State */}
          {!historyLoading && !historyError && (
            <div className="space-y-4">
              {/* Top Controls - Matching QC Style */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Cari transaksi, bahan baku..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 text-xs outline-none bg-gray-50/50"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="hidden lg:inline text-[11px]">Tampilkan:</span>
                    <select
                      value={historyLimit}
                      onChange={(e) => {
                        setHistoryLimit(Number(e.target.value));
                        setHistoryPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-text-primary text-xs font-bold outline-none cursor-pointer focus:border-amber-700"
                    >
                      {historyLimitOptions.map((option) => (
                        <option key={option} value={option}>{option} / hal</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Refresh Button */}
                  <button
                    onClick={() => refetchHistory()}
                    disabled={historyLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* History Table - Matching QC Style */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/90 border-b border-gray-200 text-text-secondary uppercase text-[10.5px] font-bold tracking-wider">
                        <th className="py-3.5 px-4">Tanggal</th>
                        <th className="py-3.5 px-4">Bahan Baku</th>
                        <th className="py-3.5 px-4">Aksi</th>
                        <th className="py-3.5 px-4 text-right">Jumlah</th>
                        <th className="py-3.5 px-4 text-right">Stok Sebelum</th>
                        <th className="py-3.5 px-4 text-right">Stok Sesudah</th>
                        <th className="py-3.5 px-4">Catatan</th>
                        <th className="py-3.5 px-4">Oleh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-12 text-gray-400">
                            <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">Belum ada riwayat transaksi</p>
                            <p className="text-xs text-gray-400 mt-1">Transaksi akan muncul di sini setelah Anda melakukan restok atau penyesuaian stok</p>
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 text-sm">
                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {new Date(item.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.material_name || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                ${item.action === 'in' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                                ${item.action === 'out' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                                ${item.action === 'adjustment' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                              `}>
                                {item.action === 'in' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                                {item.action === 'out' && <ArrowUpRight className="w-3.5 h-3.5" />}
                                {item.action === 'adjustment' && <Sliders className="w-3.5 h-3.5" />}
                                {item.action === 'in' ? 'Masuk' : item.action === 'out' ? 'Keluar' : 'Penyesuaian'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-bold text-sm ${item.action === 'in' ? 'text-green-600' : item.action === 'out' ? 'text-red-600' : 'text-amber-600'}`}>
                                {item.action === 'in' ? '+' : item.action === 'out' ? '-' : '±'}{item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-600 font-medium">{item.previous_stock ?? '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-900 font-bold">{item.new_stock ?? '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-500 max-w-[200px] truncate" title={item.notes || '-'}>
                                {item.notes || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-500">{item.creator_name || '-'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Info - Matching QC Style */}
              {historyPagination.total > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Info Text */}
                  <div className="text-sm text-gray-600 font-medium">
                    Menampilkan {((historyPagination.page - 1) * historyLimit) + 1} - {Math.min(historyPagination.page * historyLimit, historyPagination.total || 0)} dari <span className="font-bold text-gray-900">{historyPagination.total || 0}</span> transaksi
                  </div>
                  
                  {/* Right: Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={historyPagination.page === 1 || historyLoading}
                      className="p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Halaman sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page Numbers - Smart Display */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const totalPages = historyPagination.totalPages || 1;
                        const currentPage = historyPagination.page;
                        
                        if (totalPages <= 7) {
                          // Show all pages if 7 or less
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setHistoryPage(i)}
                                disabled={historyLoading}
                                className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                  currentPage === i 
                                    ? 'bg-brand-blue text-white border border-brand-blue' 
                                    : 'text-gray-600 bg-white border border-gray-300 hover:border-gray-400'
                                } disabled:opacity-50`}
                              >
                                {i}
                              </button>
                            );
                          }
                        } else {
                          // Smart pagination: first, last, current ±1
                          // Always show first page
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setHistoryPage(1)}
                              disabled={historyLoading}
                              className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                currentPage === 1 
                                  ? 'bg-brand-blue text-white border border-brand-blue' 
                                  : 'text-gray-600 bg-white border border-gray-300 hover:border-gray-400'
                              } disabled:opacity-50`}
                            >
                              1
                            </button>
                          );
                          
                          // Show ellipsis if needed
                          if (currentPage > 3) {
                            pages.push(
                              <span key="start-ellipsis" className="px-1.5 py-1.5 text-gray-400 text-sm">...</span>
                            );
                          }
                          
                          // Show current ±1 pages (but not first or last)
                          for (let i = Math.max(2, currentPage - 1); 
                               i <= Math.min(totalPages - 1, currentPage + 1); 
                               i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setHistoryPage(i)}
                                disabled={historyLoading}
                                className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                  currentPage === i 
                                    ? 'bg-brand-blue text-white border border-brand-blue' 
                                    : 'text-gray-600 bg-white border border-gray-300 hover:border-gray-400'
                                } disabled:opacity-50`}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          // Show ellipsis if needed
                          if (currentPage < totalPages - 2) {
                            pages.push(
                              <span key="end-ellipsis" className="px-1.5 py-1.5 text-gray-400 text-sm">...</span>
                            );
                          }
                          
                          // Always show last page
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setHistoryPage(totalPages)}
                              disabled={historyLoading}
                              className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                currentPage === totalPages 
                                  ? 'bg-brand-blue text-white border border-brand-blue' 
                                  : 'text-gray-600 bg-white border border-gray-300 hover:border-gray-400'
                              } disabled:opacity-50`}
                            >
                              {totalPages}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(prev + 1, historyPagination.totalPages || 1))}
                      disabled={historyPagination.page === (historyPagination.totalPages || 1) || historyLoading}
                      className="p-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Halaman berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {txType === 'in' ? 'Catat Restock / Belanja' : 'Catat Pemakaian Produksi 1'}
            </h3>

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bahan Baku</label>
                <div className="text-base font-bold text-brand-blue">{selectedMaterial?.name}</div>
                <div className="text-xs text-gray-500">{selectedMaterial?.code}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Jumlah ({selectedMaterial?.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>

            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kode</label>
                  <input
                    type="text"
                    value={matForm.code}
                    onChange={(e) => setMatForm({ ...matForm, code: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                  <select
                    value={matForm.unit}
                    onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="pcs">pcs</option>
                    <option value="dus">dus</option>
                    <option value="karung">karung</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Bahan</label>
                <input
                  type="text"
                  value={matForm.name}
                  onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                <select
                  value={matForm.category}
                  onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                >
                  <option value="meat">Daging & Unggas</option>
                  <option value="skin">Kulit Dimsum</option>
                  <option value="seasoning">Bumbu & Minyak</option>
                  <option value="flour">Tepung & Pati</option>
                  <option value="packaging">Kemasan & Saos</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={matForm.current_stock}
                    onChange={(e) => setMatForm({ ...matForm, current_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Min. Stok</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={matForm.minimum_stock}
                    onChange={(e) => setMatForm({ ...matForm, minimum_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Aman</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={matForm.safety_stock}
                    onChange={(e) => setMatForm({ ...matForm, safety_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={matForm.notes}
                  onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="flex-1 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catat Gilingan Modal - Unchanged */}
      {showGilinganModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FlameKindling className="w-5 h-5 text-brand-blue" />
              Catat Realisasi Gilingan Hari Ini
            </h3>

            <form onSubmit={handleGilinganSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Gilingan</label>
                  <input
                    type="number"
                    min="1"
                    value={gilinganForm.jumlah}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGilinganForm({ ...gilinganForm, jumlah: val });
                      setGilinganPreview(computeGilinganPreview(val));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={gilinganForm.tanggal}
                    onChange={(e) => setGilinganForm({ ...gilinganForm, tanggal: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={gilinganForm.notes}
                  onChange={(e) => setGilinganForm({ ...gilinganForm, notes: e.target.value })}
                  rows="2"
                  placeholder="Catatan shift produksi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              {gilinganPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Preview Pemotongan Stok (BOM)</h4>
                  <div className="space-y-1.5 text-xs">
                    {gilinganPreview.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.qty} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGilinganModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gilinganSubmitting}
                  className="flex-1 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {gilinganSubmitting ? 'Memproses...' : 'Catat & Potong Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Atur Target */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Atur Target Gilingan</h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Target (Gilingan)</label>
                <input
                  type="number"
                  min="1"
                  value={targetModalInput}
                  onChange={(e) => setTargetModalInput(e.target.value)}
                  className="w-full text-center text-3xl font-black text-brand-blue px-4 py-3 bg-blue-50/30 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Isi Cepat</label>
                <div className="flex flex-wrap gap-2">
                  {[20, 25, 30, 36, 40, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTargetModalInput(num.toString())}
                      className="flex-1 min-w-[50px] px-2 py-1.5 bg-gray-100 hover:bg-brand-blue/10 text-gray-700 hover:text-brand-blue text-sm font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const num = parseInt(targetModalInput);
                    if (!isNaN(num) && num > 0) {
                      handleTargetGilinganChange(num);
                      setShowTargetModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
                >
                  Atur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Target Mingguan (Atur Jadwal) Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-black font-heading text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-brand-blue" />
                Atur Jadwal Produksi Mingguan
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">

              {scheduleLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-brand-blue">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-sm font-medium">Memuat pengaturan...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((dayName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleActiveDay(idx)}
                    >
                      <span className={`text-sm font-semibold ${activeDays.includes(idx) ? 'text-gray-900' : 'text-gray-400'}`}>
                        {dayName}
                      </span>
                      <input
                        type="checkbox"
                        checked={activeDays.includes(idx)}
                        readOnly
                        className="w-5 h-5 rounded text-brand-blue border-gray-300 focus:ring-brand-blue cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={submittingSchedule || scheduleLoading}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submittingSchedule && <RefreshCw className="w-4 h-4 animate-spin" />}
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
