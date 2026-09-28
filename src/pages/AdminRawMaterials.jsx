import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  X,
  Edit2,
  History,
  Info
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
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'readiness' | 'history'

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

  useEffect(() => {
    fetchMaterials();
  }, []);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Daftar Stok Bahan Baku ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('readiness')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'readiness'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Kalkulator Kesiapan H-1
          {readiness?.overall_status !== 'SIAP' && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-brand-blue border-b-2 border-brand-blue'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Masuk/Keluar
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Kebutuhan Detail Standar Resep (Bill of Materials)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-y border-gray-200">
                      <th className="px-4 py-3">Nama Bahan</th>
                      <th className="px-4 py-3">Rasio Standar Resep</th>
                      <th className="px-4 py-3">Kebutuhan ({targetGilingan} Gilingan)</th>
                      <th className="px-4 py-3">Stok Gudang</th>
                      <th className="px-4 py-3">Status Kesiapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {readiness?.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION HISTORY */}
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
    </div>
  );
}
