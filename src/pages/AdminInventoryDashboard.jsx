import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  ShoppingBag,
  Video,
  Briefcase,
  Store,
  Globe,
  Trash2,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Search,
  PlusCircle,
  Package,
  ArrowLeftRight,
  X
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';
import { getAdminRole, canStockOut } from '../utils/adminAuth';

const CHANNELS_META = {
  shopee: { name: 'Shopee', icon: ShoppingBag, color: 'bg-orange-500', lightColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  tiktok: { name: 'TikTok', icon: Video, color: 'bg-pink-500', lightColor: 'bg-pink-50 text-pink-700 border-pink-200' },
  po_b2b: { name: 'PO B2B', icon: Briefcase, color: 'bg-blue-600', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  offline: { name: 'Offline', icon: Store, color: 'bg-emerald-600', lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  web: { name: 'Web', icon: Globe, color: 'bg-indigo-600', lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  waste: { name: 'Rusak / Sample', icon: Trash2, color: 'bg-gray-500', lightColor: 'bg-gray-50 text-gray-700 border-gray-200' }
};

export default function AdminInventoryDashboard() {
  const userRole = getAdminRole() || 'admin';
  const hasStockOutAccess = canStockOut(userRole);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'critical' | 'warning' | 'safe'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Rebalance Quota Modal State
  const [rebalanceModalOpen, setRebalanceModalOpen] = useState(false);
  const [rebalanceTargetProduct, setRebalanceTargetProduct] = useState(null);
  const [rebalanceFromPool, setRebalanceFromPool] = useState('offline');
  const [rebalanceQty, setRebalanceQty] = useState(1);
  const [rebalanceReason, setRebalanceReason] = useState('');
  const [rebalanceSubmitting, setRebalanceSubmitting] = useState(false);
  const [rebalanceError, setRebalanceError] = useState('');
  const [rebalanceSuccessMsg, setRebalanceSuccessMsg] = useState('');

  const handleOpenRebalance = (product = null) => {
    const target = product || (data?.all_products?.[0] || null);
    setRebalanceTargetProduct(target);
    setRebalanceFromPool('offline');
    setRebalanceQty(5);
    setRebalanceReason('');
    setRebalanceError('');
    setRebalanceModalOpen(true);
  };

  const handleRebalanceSubmit = async (e) => {
    e.preventDefault();
    if (!rebalanceTargetProduct) return;
    setRebalanceSubmitting(true);
    setRebalanceError('');

    const toPool = rebalanceFromPool === 'offline' ? 'online' : 'offline';
    try {
      const res = await api.post('/api/inventory/stock-rebalance', {
        product_id: rebalanceTargetProduct.id,
        from_pool: rebalanceFromPool,
        to_pool: toPool,
        quantity: Number(rebalanceQty),
        reason: rebalanceReason || undefined
      }, { auth: 'admin' });

      if (res.success) {
        setRebalanceSuccessMsg(res.message || 'Transfer kuota stok berhasil!');
        setRebalanceModalOpen(false);
        fetchSummary();
        setTimeout(() => setRebalanceSuccessMsg(''), 5000);
      } else {
        setRebalanceError(res.error || 'Gagal memproses transfer kuota');
      }
    } catch {
      setRebalanceError('Koneksi bermasalah saat memproses transfer kuota');
    } finally {
      setRebalanceSubmitting(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/inventory/dashboard/summary', { auth: 'admin' });
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Gagal memuat ringkasan stok');
      }
    } catch (err) {
      console.error('Error fetching inventory summary:', err);
      setError('Terjadi kendala jaringan saat memuat data inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-10 h-10 text-brand-blue animate-spin mb-4" />
        <p className="text-text-secondary font-medium text-sm">Memuat data...</p>
      </div>
    );
  }

  const products = data?.all_products || [];
  const criticalProducts = data?.critical_products || [];
  const warningProducts = data?.warning_products || [];
  const todayProd = data?.today_production || { planned_lots: 0, completed_lots: 0, completed_pcs: 0, capacity_lots: 20, max_capacity_lots: 24 };
  const channelStats = data?.channel_distribution || {};
  const totalOutPcs = data?.total_out_pcs || 0;

  // Filter products for the table
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesQuery) return false;

    if (filterStatus === 'critical') return p.buffer_status === 'critical';
    if (filterStatus === 'warning') return p.buffer_status === 'warning';
    if (filterStatus === 'safe') return p.buffer_status === 'safe';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const capacityPct = Math.min(100, Math.round((todayProd.completed_lots / todayProd.capacity_lots) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {rebalanceSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{rebalanceSuccessMsg}</span>
          </div>
          <button onClick={() => setRebalanceSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchSummary} className="underline text-xs font-semibold">Coba Lagi</button>
        </div>
      )}
      {/* Top 4 KPI Metrics Grid (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Stok Freezer */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">Total Stok Freezer</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-extrabold text-text-primary font-heading">
              {data?.total_stock_pcs?.toLocaleString('id-ID') || 0}
              <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">Pack</span>
            </div>
            {/* Dual Pool Quota Breakdown */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Offline: {(data?.total_stock_offline || 0).toLocaleString('id-ID')} pk
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-pink-50 text-pink-800 font-bold border border-pink-200">
                Online: {(data?.total_stock_online || 0).toLocaleString('id-ID')} pk
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Buffer Kritis */}
        <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all flex flex-col justify-between ${(data?.critical_count || 0) > 0
          ? 'bg-red-50/50 border-red-200'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">Stock Kritis</span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${(data?.critical_count || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
              }`}>
              <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className={`text-xl sm:text-3xl font-extrabold font-heading ${(data?.critical_count || 0) > 0 ? 'text-red-700' : 'text-text-primary'
              }`}>
              {data?.critical_count || 0}
              <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">varian</span>
            </div>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
              Kurang dari 70 pack
            </p>
          </div>
        </div>

        {/* Metric 3: Buffer Waspada */}
        <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden flex flex-col justify-between ${(data?.warning_count || 0) > 0
          ? 'bg-amber-50/50 border-amber-200'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">Stock Mulai Habis</span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${(data?.warning_count || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
              <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className={`text-xl sm:text-3xl font-extrabold font-heading ${(data?.warning_count || 0) > 0 ? 'text-amber-700' : 'text-text-primary'
              }`}>
              {data?.warning_count || 0}
              <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">varian</span>
            </div>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
              Antara 70-100 pack
            </p>
          </div>
        </div>

        {/* Metric 4: Realisasi Produksi Hari Ini */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider leading-tight">Produksi Hari Ini</span>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${todayProd.completed_lots > 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
              }`}>
              <Factory size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-3xl font-extrabold text-text-primary font-heading">
              {todayProd.completed_lots}
              <span className="text-xs sm:text-sm font-normal text-text-secondary ml-1 sm:ml-1.5">/ {todayProd.capacity_lots || 450} Pack</span>
            </div>
            {todayProd.completed_pcs > 0 ? (
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-emerald-700 font-semibold truncate">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>{todayProd.completed_pcs} butir lolos QC</span>
              </div>
            ) : (
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-text-secondary">
                <Clock size={12} className="text-gray-400 shrink-0" />
                <span>Belum ada</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Dapur Produksi & Kanal Penjualan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Utilisasi Kapasitas Dapur Produksi */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Factory size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary font-heading">
                    Kapasitas Pengemasan (P2) Hari Ini
                  </h2>
                </div>
              </div>
            </div>

            {/* Gauge Progress Bar */}
            <div className="space-y-2 mt-4">

              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200 relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${todayProd.completed_lots > (todayProd.max_capacity_lots || 520)
                    ? 'bg-red-500'
                    : todayProd.completed_lots > (todayProd.capacity_lots || 450)
                      ? 'bg-amber-500'
                      : 'bg-brand-blue'
                    }`}
                  style={{ width: `${Math.min(100, (todayProd.completed_lots / (todayProd.max_capacity_lots || 520)) * 100)}%` }}
                />
                {/* 450 Pack Normal Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                  style={{ left: `${(450 / 520) * 100}%` }}
                  title="Target Normal (450 Pack)"
                />
              </div>
              <div className="flex justify-between text-xs text-text-secondary font-medium">
                <span>0 Pack</span>
                <span className="text-text-primary font-bold">{todayProd.capacity_lots || 450} Pack (Target)</span>
                <span>{todayProd.max_capacity_lots || 520} Pack (Max)</span>
              </div>
            </div>

            {/* Detail Pills */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <div className="text-xs text-text-secondary">Direncanakan</div>
                <div className="text-base font-bold text-text-primary font-heading mt-0.5">
                  {todayProd.planned_lots} Pack
                </div>
              </div>
              <div className={`p-3 rounded-xl border text-center ${todayProd.completed_lots > 0
                ? 'bg-emerald-50/60 border-emerald-100'
                : 'bg-gray-50 border-gray-100'
                }`}>
                <div className={`text-xs ${todayProd.completed_lots > 0 ? 'text-emerald-800 font-semibold' : 'text-text-secondary'
                  }`}>
                  Disetujui QC
                </div>
                <div className={`text-base font-bold font-heading mt-0.5 ${todayProd.completed_lots > 0 ? 'text-emerald-700' : 'text-text-secondary'
                  }`}>
                  {todayProd.completed_lots} Pack
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <div className="text-xs text-text-secondary">Sisa Target</div>
                <div className="text-base font-bold text-brand-blue font-heading mt-0.5">
                  {Math.max(0, (todayProd.capacity_lots || 450) - todayProd.completed_lots)} Pack
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link
              to="/admin/production"
              className="text-xs font-bold text-brand-blue hover:text-brand-blue-dark inline-flex items-center gap-1"
            >
              <span>Buka Portal Produksi</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Card: Distribusi Kanal Pengeluaran Stok Multi-Channel */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary font-heading">
                    Distribusi Pengeluaran Stok
                  </h2>
                </div>
              </div>
            </div>

            {/* Visual Multi-Channel Progress Bar */}
            {totalOutPcs > 0 ? (
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 mb-5 border border-gray-100">
                {Object.entries(channelStats).map(([ch, qty]) => {
                  if (!qty || qty <= 0) return null;
                  const meta = CHANNELS_META[ch] || { color: 'bg-gray-400' };
                  const pct = (qty / totalOutPcs) * 100;
                  return (
                    <div
                      key={ch}
                      className={`${meta.color} h-full transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${meta.name || ch}: ${qty} pack (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-text-secondary mb-4">
                Belum ada transaksi pengeluaran stok tercatat.
              </div>
            )}

            {/* Channel Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(CHANNELS_META).map(([key, meta]) => {
                const qty = channelStats[key] || 0;
                const Icon = meta.icon;
                const pct = totalOutPcs > 0 ? Math.round((qty / totalOutPcs) * 100) : 0;

                return (
                  <div key={key} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate font-medium">{meta.name.split(' ')[0]}</span>
                    </div>
                    <div className="text-sm font-bold text-text-primary font-heading">
                      {qty.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-text-secondary">pack</span>
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {pct}% kontribusi
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-text-secondary">

            <Link to="/admin/stock-out" className="text-xs font-semibold text-brand-blue hover:underline">
              Lihat Riwayat Transaksi &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Product Stock Table & Buffer Control */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary font-heading">
              Monitoring Buffer Stock per Produk
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk / SKU..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
              />
            </div>

            {/* Quick Rebalance Button */}
            <button
              type="button"
              onClick={() => handleOpenRebalance(null)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-hover transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <ArrowLeftRight size={14} />
              <span>Transfer Kuota</span>
            </button>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-white text-text-primary shadow-xs font-bold' : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setFilterStatus('critical')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === 'critical' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-red-700 hover:bg-red-50'
                  }`}
              >
                Kritis ({criticalProducts.length})
              </button>
              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === 'warning' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-800 hover:bg-amber-50'
                  }`}
              >
                Waspada ({warningProducts.length})
              </button>
              <button
                onClick={() => setFilterStatus('safe')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === 'safe' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
              >
                Aman
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-text-secondary border-b border-gray-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-center">Produk & SKU</th>
                <th className="py-3.5 px-4 text-center">Stok Freezer</th>
                <th className="py-3.5 px-4 text-center">Alokasi Kuota</th>
                <th className="py-3.5 px-4 text-center">Buffer Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-secondary">
                    <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium">Tidak ada produk yang cocok dengan filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const stock = prod.stock_qty || 0;
                  const isMika = (prod.sku || '').includes('MIKA') || (prod.name || '').toLowerCase().includes('mika');
                  const packSize = prod.pack_size || (isMika ? 50 : 25);
                  const totalPcs = stock * packSize;
                  const minBuffer = prod.min_buffer_stock || 70;
                  const safeTarget = 100;
                  const bufferRatio = Math.min(100, Math.round((stock / safeTarget) * 100));

                  let statusBadge = {
                    label: 'Aman',
                    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    dot: 'bg-emerald-500'
                  };
                  if (prod.buffer_status === 'critical' || stock < minBuffer) {
                    statusBadge = {
                      label: 'KRITIS',
                      bg: 'bg-red-100 text-red-800 border-red-200',
                      dot: 'bg-red-600'
                    };
                  } else if (prod.buffer_status === 'warning' || (stock >= minBuffer && stock <= safeTarget)) {
                    statusBadge = {
                      label: 'Waspada (70-100)',
                      bg: 'bg-amber-100 text-amber-800 border-amber-200',
                      dot: 'bg-amber-500'
                    };
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-text-primary text-sm font-heading">{prod.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-text-secondary">{prod.sku || 'NO-SKU'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock in Kemasan */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-sm font-extrabold font-heading ${stock < minBuffer ? 'text-red-700' : 'text-text-primary'
                          }`}>
                          {stock.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-text-secondary ml-1">{prod.unit_label || (isMika ? 'mika' : 'pack')}</span>
                      </td>

                      {/* Dual Pool Quota Allocation */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Offline: {prod.stock_offline ?? Math.round(stock * 0.6)} pk
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-pink-50 text-pink-800 font-bold text-[11px] border border-pink-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            Online: {prod.stock_online ?? Math.round(stock * 0.4)} pk
                          </span>
                        </div>
                      </td>

                      {/* Buffer Target Progress Bar & Status */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                              <span>{statusBadge.label}</span>
                            </span>
                            <span className="font-bold text-text-secondary">{bufferRatio}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${stock < minBuffer
                                ? 'bg-red-500'
                                : stock <= safeTarget
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                }`}
                              style={{ width: `${bufferRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action: Transfer Kuota */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenRebalance(prod)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-brand-blue hover:text-white text-text-primary text-xs font-semibold transition-all border border-gray-200 shadow-2xs"
                          title="Transfer Kuota Online ⇄ Offline"
                        >
                          <ArrowLeftRight size={13} />
                          <span>Transfer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary & Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-text-secondary gap-3">
          <span>Total produk di inventaris: <strong>{products.length}</strong> varian</span>
        </div>

        {totalPages > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredProducts.length}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
              showInfo={false}
            />
          </div>
        )}
      </div>

      {/* Modal Rebalance Kuota Stok Online ⇄ Offline */}
      {rebalanceModalOpen && rebalanceTargetProduct && (() => {
        const stockOff = rebalanceTargetProduct.stock_offline ?? Math.round((rebalanceTargetProduct.stock_qty || 0) * 0.6);
        const stockOn = rebalanceTargetProduct.stock_online ?? Math.round((rebalanceTargetProduct.stock_qty || 0) * 0.4);
        const maxTransfer = rebalanceFromPool === 'offline' ? stockOff : stockOn;
        const toPool = rebalanceFromPool === 'offline' ? 'online' : 'offline';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setRebalanceModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary font-heading">
                    Transfer Kuota Stok
                  </h3>
                </div>
              </div>

              {rebalanceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span>{rebalanceError}</span>
                </div>
              )}

              <form onSubmit={handleRebalanceSubmit} className="space-y-4 text-xs font-body">
                {/* Product Select */}
                <div>
                  <label className="block text-text-primary font-semibold mb-1">
                    Pilih Produk *
                  </label>
                  <select
                    value={rebalanceTargetProduct.id}
                    onChange={(e) => {
                      const found = products.find(p => p.id === e.target.value);
                      if (found) setRebalanceTargetProduct(found);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-semibold cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Stock Quotas Overview */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <div className="p-2 bg-white rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">Kuota Offline</span>
                    <span className="text-sm font-black text-emerald-800 font-heading">{stockOff}</span>
                    <span className="text-[10px] text-gray-500 block">Kasir / Web / PO</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-pink-100">
                    <span className="text-[10px] text-pink-700 font-bold block uppercase tracking-wider">Kuota Online</span>
                    <span className="text-sm font-black text-pink-800 font-heading">{stockOn}</span>
                    <span className="text-[10px] text-gray-500 block">Shopee / TikTok</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-100">
                    <span className="text-[10px] text-brand-blue font-bold block uppercase tracking-wider">Fisik Freezer</span>
                    <span className="text-sm font-black text-text-primary font-heading">{rebalanceTargetProduct.stock_qty}</span>
                    <span className="text-[10px] text-gray-500 block">Total Pack</span>
                  </div>
                </div>

                {/* Transfer Direction */}
                <div>
                  <label className="block text-text-primary font-semibold mb-1.5">
                    Arah Transfer Kuota *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRebalanceFromPool('offline')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${rebalanceFromPool === 'offline'
                        ? 'border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue text-brand-blue font-bold'
                        : 'border-gray-200 bg-white text-text-secondary hover:bg-gray-50 font-medium'
                        }`}
                    >
                      <span className="text-xs">Offline ➔ Online</span>
                      <span className="text-[10px] font-normal text-text-secondary mt-0.5">Untuk Shopee / TikTok Live</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRebalanceFromPool('online')}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${rebalanceFromPool === 'online'
                        ? 'border-brand-blue bg-blue-50/50 ring-1 ring-brand-blue text-brand-blue font-bold'
                        : 'border-gray-200 bg-white text-text-secondary hover:bg-gray-50 font-medium'
                        }`}
                    >
                      <span className="text-xs">Online ➔ Offline</span>
                      <span className="text-[10px] font-normal text-text-secondary mt-0.5">Untuk Toko Fisik & Katering MBG</span>
                    </button>
                  </div>
                </div>

                {/* Transfer Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-text-primary font-semibold">
                      Jumlah Pack Yang Ditransfer *
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
                      className="w-20 px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-bold text-sm"
                    />
                    <div className="flex items-center gap-1">
                      {[5, 10, 25].map(n => (
                        <button
                          key={n}
                          type="button"
                          disabled={maxTransfer < n}
                          onClick={() => setRebalanceQty(n)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-text-secondary"
                        >
                          +{n}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={maxTransfer <= 0}
                        onClick={() => setRebalanceQty(maxTransfer)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Maksimal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transfer Reason */}
                <div>
                  <label className="block text-text-primary font-semibold mb-1">
                    Alasan / Catatan Transfer (Opsional)
                  </label>
                  <input
                    type="text"
                    value={rebalanceReason}
                    onChange={(e) => setRebalanceReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none text-xs"
                  />
                </div>

                {/* Modal Footer Buttons */}
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
                        <span>Transfer {rebalanceQty} Pack ke {toPool.toUpperCase()}</span>
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
