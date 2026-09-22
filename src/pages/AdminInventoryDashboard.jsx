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
  Package
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';

const CHANNELS_META = {
  shopee: { name: 'Shopee', icon: ShoppingBag, color: 'bg-orange-500', lightColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  tiktok: { name: 'TikTok', icon: Video, color: 'bg-pink-500', lightColor: 'bg-pink-50 text-pink-700 border-pink-200' },
  po_b2b: { name: 'PO B2B', icon: Briefcase, color: 'bg-blue-600', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  offline: { name: 'Offline', icon: Store, color: 'bg-emerald-600', lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  web: { name: 'Web', icon: Globe, color: 'bg-indigo-600', lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  waste: { name: 'Rusak / Sample', icon: Trash2, color: 'bg-gray-500', lightColor: 'bg-gray-50 text-gray-700 border-gray-200' }
};

export default function AdminInventoryDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'critical' | 'warning' | 'safe'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              Freezer & Production Control
            </span>
            <span className="text-xs text-text-secondary">Standar 1 Lot = 25 Pcs</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            Ringkasan Inventaris & Buffer Stock
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-btn border border-bg-cream-dark/90 bg-white text-text-secondary hover:text-text-primary hover:bg-bg-cream/60 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/admin/production"
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Produksi</span>
          </Link>

          <Link
            to="/admin/stock-out"
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight size={15} />
            <span>Stok Keluar</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchSummary} className="underline text-xs font-semibold">Coba Lagi</button>
        </div>
      )}

      {/* Critical Stock Alert Banner if any */}
      {criticalProducts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 font-heading flex items-center gap-2">
                  <span>Peringatan Buffer Stock: {criticalProducts.length} Produk di Bawah Batas Minimum!</span>
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  Sesuai arahan rapat, stok freezer wajib dijaga minimal 70 pcs (buffer aman). Segera buat rencana produksi lot untuk varian berikut:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {criticalProducts.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-200 text-xs font-semibold">
                      <span>{p.name}</span>
                      <span className="font-mono text-red-700 font-bold">({p.stock_qty} pcs / {p.stock_lots} lot)</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/admin/production"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <span>Jadwalkan Lot Sekarang</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Stok Freezer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Stok Freezer</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-primary font-heading">
              {data?.total_stock_pcs?.toLocaleString('id-ID') || 0}
              <span className="text-sm font-normal text-text-secondary ml-1.5">pcs</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="font-semibold text-brand-blue">~{data?.total_stock_lots || 0} Lot Standar</span>
              <span>(isi 25/mika)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Buffer Kritis */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all ${(data?.critical_count || 0) > 0
          ? 'bg-red-50/50 border-red-200'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stock Kritis</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(data?.critical_count || 0) > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
              }`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold font-heading ${(data?.critical_count || 0) > 0 ? 'text-red-700' : 'text-text-primary'
              }`}>
              {data?.critical_count || 0}
              <span className="text-sm font-normal text-text-secondary ml-1.5">varian</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Stock kurang dari 70 pcs
            </p>
          </div>
        </div>

        {/* Metric 3: Buffer Waspada */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${(data?.warning_count || 0) > 0
          ? 'bg-amber-50/50 border-amber-200'
          : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stock Mulai Habis</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(data?.warning_count || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold font-heading ${(data?.warning_count || 0) > 0 ? 'text-amber-700' : 'text-text-primary'
              }`}>
              {data?.warning_count || 0}
              <span className="text-sm font-normal text-text-secondary ml-1.5">varian</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Stock Antara 70-100 pcs
            </p>
          </div>
        </div>

        {/* Metric 4: Realisasi Produksi Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Produksi Hari Ini</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${todayProd.completed_lots > 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
              }`}>
              <Factory size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-primary font-heading">
              {todayProd.completed_lots}
              <span className="text-sm font-normal text-text-secondary ml-1.5">/ {todayProd.capacity_lots} Lot</span>
            </div>
            {todayProd.completed_pcs > 0 ? (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 size={13} />
                <span>{todayProd.completed_pcs} pcs fisik disetujui QC</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                <Clock size={13} className="text-gray-400" />
                <span>Belum ada produksi</span>
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
                    Kapasitas Dapur Produksi Hari Ini
                  </h2>
                </div>
              </div>
            </div>

            {/* Gauge Progress Bar */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs text-text-secondary font-medium">
                <span>0 Lot</span>
                <span className="text-text-primary font-bold">20 Lot (Batas Normal)</span>
                <span>24 Lot (Maks Lembur)</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200 relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${todayProd.completed_lots > 24
                    ? 'bg-red-500'
                    : todayProd.completed_lots > 20
                      ? 'bg-amber-500'
                      : 'bg-brand-blue'
                    }`}
                  style={{ width: `${Math.min(100, (todayProd.completed_lots / 24) * 100)}%` }}
                />
                {/* 20 Lot Normal Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                  style={{ left: `${(20 / 24) * 100}%` }}
                  title="Target Normal (20 Lot)"
                />
              </div>
            </div>

            {/* Detail Pills */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <div className="text-xs text-text-secondary">Direncanakan PPSI</div>
                <div className="text-base font-bold text-text-primary font-heading mt-0.5">
                  {todayProd.planned_lots} Lot
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
                  {todayProd.completed_lots} Lot
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <div className="text-xs text-text-secondary">Sisa Target</div>
                <div className="text-base font-bold text-brand-blue font-heading mt-0.5">
                  {Math.max(0, todayProd.capacity_lots - todayProd.completed_lots)} Lot
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary mt-3">
              Target harian normal 20 Lot (500 pcs) • Maks lembur 24 Lot
            </p>
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
                  <p className="text-xs text-text-secondary">Total {totalOutPcs.toLocaleString('id-ID')} pcs dialokasikan keluar dari freezer</p>
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
                      title={`${meta.name || ch}: ${qty} pcs (${pct.toFixed(1)}%)`}
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
                      {qty.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-text-secondary">pcs</span>
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
                <th className="py-3.5 px-4 text-center">Konversi Lot</th>
                <th className="py-3.5 px-4 text-center">Tingkat Keterisian Buffer</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Tindakan Lanjut</th>
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
                  const lots = prod.stock_lots || Math.floor(stock / 25);
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
                              {prod.category && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-text-secondary text-[10px]">
                                  {prod.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock in Pcs */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-sm font-extrabold font-heading ${stock < minBuffer ? 'text-red-700' : 'text-text-primary'
                          }`}>
                          {stock.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-text-secondary ml-1">pcs</span>
                      </td>

                      {/* Lots Conversion */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold text-xs border border-blue-100">
                          <Layers size={13} />
                          <span>{lots} Lot</span>
                        </span>
                      </td>

                      {/* Buffer Target Progress Bar */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-text-secondary">
                            <span>{stock} / {safeTarget} pcs</span>
                            <span className="font-bold">{bufferRatio}%</span>
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

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* Quick Action Links */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/admin/production"
                            className="px-2.5 py-1.5 rounded-lg bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white font-bold text-[11px] transition-colors"
                            title="Jadwalkan Produksi Lot"
                          >
                            Produksi
                          </Link>
                          <Link
                            to="/admin/stock-out"
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-text-primary font-medium text-[11px] transition-colors"
                            title="Keluarkan Stok"
                          >
                            Keluarkan
                          </Link>
                        </div>
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
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Kritis (&lt;70 pcs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Waspada (70-100 pcs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Aman (&gt;100 pcs)
            </span>
          </div>
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
    </div>
  );
}
