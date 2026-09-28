import React, { useState, useEffect, useMemo } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Store,
  Video,
  Briefcase,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react';
import api from '../api/client';
import Pagination from '../components/ui/Pagination';

const CHANNELS = [
  { id: 'all', name: 'Semua Saluran', icon: Layers, color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'web', name: 'Web Store', icon: ShoppingBag, color: 'bg-blue-50 text-brand-blue border-blue-200' },
  { id: 'offline', name: 'POS Kasir Toko', icon: Store, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'shopee', name: 'Shopee', icon: ShoppingBag, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'tiktok', name: 'TikTok Shop', icon: Video, color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'po_b2b', name: 'PO B2B', icon: Briefcase, color: 'bg-purple-50 text-purple-700 border-purple-200' }
];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [kpi, setKpi] = useState({
    total_revenue: 0,
    total_transactions: 0,
    total_items_sold: 0,
    today_revenue: 0,
    today_count: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 15,
    total_records: 0,
    total_pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | '7days' | '30days'

  // Modal / Detail State
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError('');

    let start_date = null;
    let end_date = null;
    const now = new Date();

    if (datePreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      start_date = todayStr;
      end_date = todayStr;
    } else if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start_date = d.toISOString().split('T')[0];
    } else if (datePreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start_date = d.toISOString().split('T')[0];
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pagination.per_page)
      });

      if (selectedChannel !== 'all') params.append('channel', selectedChannel);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);

      const res = await api.get(`/api/orders/transactions?${params.toString()}`, { auth: 'admin' });
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.kpi) setKpi(res.data.kpi);
      } else {
        setError(res.error || 'Gagal memuat data transaksi');
      }
    } catch {
      setError('Koneksi terputus saat mengambil data riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [selectedChannel, selectedStatus, datePreset]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTransactions(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatWhatsAppUrl = (phone, buyerName) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('08')) {
      clean = '628' + clean.slice(2);
    } else if (!clean.startsWith('62') && clean.length > 8) {
      clean = '62' + clean;
    }
    const text = encodeURIComponent(`Halo Kak ${buyerName || ''}, terima kasih telah memesan di Makan Dimsum Indonesia!`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  const getChannelBadge = (channel, label) => {
    switch (channel) {
      case 'web':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-200">
            <ShoppingBag size={12} />
            <span>{label || 'Web Store'}</span>
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Store size={12} />
            <span>{label || 'POS Kasir'}</span>
          </span>
        );
      case 'shopee':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <ShoppingBag size={12} />
            <span>{label || 'Shopee'}</span>
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            <Video size={12} />
            <span>{label || 'TikTok Shop'}</span>
          </span>
        );
      case 'po_b2b':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Briefcase size={12} />
            <span>{label || 'PO B2B'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <Layers size={12} />
            <span>{label || channel?.toUpperCase()}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} />
            LUNAS
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} />
            PENDING
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle size={12} />
            BATAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
            {status?.toUpperCase()}
          </span>
        );
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDateTimeWib = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(date) + ' WIB';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fetchTransactions(pagination.page)}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-gray-50 shadow-xs transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-text-primary font-heading">
              {formatRupiah(kpi.total_revenue)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Dari {kpi.total_transactions} transaksi sukses
            </p>
          </div>
        </div>

        {/* Omzet Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-brand-blue font-heading">
              {formatRupiah(kpi.today_revenue)}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {kpi.today_count} transaksi hari ini
            </p>
          </div>
        </div>

        {/* Total Item Terjual */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Item Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-text-primary font-heading">
              {kpi.total_items_sold.toLocaleString('id-ID')}
              <span className="text-sm font-semibold text-text-secondary ml-1">pcs</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Akumulasi seluruh saluran
            </p>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Catatan Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ReceiptText size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-text-primary font-heading">
              {pagination.total_records.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Termasuk pending & selesai
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama buyer, nomor WA, ID pesanan, nama item..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold text-text-primary transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari Terakhir' },
              { id: '30days', label: '30 Hari Terakhir' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${datePreset === p.id
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold text-text-secondary mr-1 flex items-center gap-1">
            <Filter size={14} />
            Saluran:
          </span>
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            const isSelected = selectedChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${isSelected
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-50 text-text-secondary border border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <Icon size={14} />
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transactions Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary space-y-3">
            <RefreshCw size={28} className="animate-spin mx-auto text-brand-gold" />
            <p className="text-sm font-medium">Memuat riwayat transaksi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <XCircle size={32} className="mx-auto" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={() => fetchTransactions(pagination.page)}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-text-secondary space-y-2">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
              <ReceiptText size={32} />
            </div>
            <h3 className="font-heading font-bold text-base text-text-primary">Tidak Ada Transaksi</h3>
            <p className="text-xs max-w-sm mx-auto">
              Tidak ditemukan catatan transaksi yang sesuai dengan filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-gray-200 text-text-secondary text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">No & Waktu</th>
                  <th className="py-3.5 px-4 font-bold">Buyer & Kontak</th>
                  <th className="py-3.5 px-4 font-bold">Saluran</th>
                  <th className="py-3.5 px-4 font-bold">Menu & Kuantitas</th>
                  <th className="py-3.5 px-4 font-bold text-right">Nominal Transaksi</th>
                  <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const waUrl = formatWhatsAppUrl(tx.buyer_phone, tx.buyer_name);
                  const isCopied = copiedPhone === tx.buyer_phone;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      {/* 1. No & Waktu */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-xs text-brand-red">
                          #{tx.order_number}
                        </div>
                        <div className="text-[11px] text-text-secondary mt-0.5">
                          {formatDateTimeWib(tx.created_at)}
                        </div>
                      </td>

                      {/* 2. Buyer & Kontak */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-text-primary text-[13px]">
                          {tx.buyer_name || 'Pelanggan'}
                        </div>
                        {tx.buyer_phone && tx.buyer_phone !== '-' ? (
                          <div
                            className="flex items-center gap-1.5 mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded-md">
                              {tx.buyer_phone}
                            </span>
                            <button
                              onClick={() => handleCopyPhone(tx.buyer_phone)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition"
                              title="Salin Nomor WhatsApp"
                            >
                              {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold transition"
                                title="Buka Chat WhatsApp"
                              >
                                <MessageCircle size={12} />
                                <span>Chat WA</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Tanpa No. WA</span>
                        )}
                      </td>

                      {/* 3. Saluran */}
                      <td className="py-3.5 px-4 align-top">
                        {getChannelBadge(tx.channel, tx.channel_label)}
                      </td>

                      {/* 4. Menu & Kuantitas */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        <div className="space-y-1">
                          {tx.items && tx.items.length > 0 ? (
                            <>
                              <div className="text-xs text-text-primary font-medium truncate">
                                {tx.items[0].quantity}x {tx.items[0].product_name}
                              </div>
                              {tx.items.length > 1 && (
                                <div className="text-[11px] text-text-secondary">
                                  +{tx.items.length - 1} varian lainnya
                                </div>
                              )}
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold mt-1">
                                <Package size={11} />
                                <span>Total: {tx.total_quantity} item</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Nominal Transaksi */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="font-extrabold text-[15px] font-mono text-text-primary">
                          {formatRupiah(tx.total_amount)}
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                          {getStatusBadge(tx.status)}
                          <span className="text-[11px] text-text-secondary font-medium uppercase">
                            • {tx.payment_method}
                          </span>
                        </div>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-text-primary hover:bg-gray-100 transition inline-flex items-center gap-1"
                        >
                          <span>Rincian</span>
                          <ChevronDown size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_records > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#FAF7F2]/50">
            <Pagination
              currentPage={pagination.page}
              totalItems={pagination.total_records}
              pageSize={pagination.per_page}
              onPageChange={(nextPage) => fetchTransactions(nextPage)}
              itemLabel="transaksi"
            />
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF7]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-brand-red">
                    #{selectedTransaction.order_number}
                  </span>
                  {getChannelBadge(selectedTransaction.channel, selectedTransaction.channel_label)}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  Waktu: {formatDateTimeWib(selectedTransaction.created_at)}
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 rounded-full hover:bg-gray-200 text-text-secondary transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Buyer Information Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Informasi Pembeli
                </span>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-base text-text-primary">
                      {selectedTransaction.buyer_name || 'Pelanggan'}
                    </div>
                    {selectedTransaction.buyer_phone && selectedTransaction.buyer_phone !== '-' ? (
                      <div className="text-xs text-text-secondary font-mono mt-0.5">
                        WhatsApp: {selectedTransaction.buyer_phone}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic mt-0.5">
                        Tidak ada kontak telepon
                      </div>
                    )}
                  </div>

                  {selectedTransaction.buyer_phone && (
                    <a
                      href={formatWhatsAppUrl(selectedTransaction.buyer_phone, selectedTransaction.buyer_name)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 transition"
                    >
                      <MessageCircle size={14} />
                      <span>Chat WhatsApp</span>
                    </a>
                  )}
                </div>

                {selectedTransaction.notes && (
                  <div className="text-xs bg-white p-2.5 rounded-xl border border-gray-200 text-text-secondary mt-2">
                    <span className="font-bold text-text-primary">Catatan:</span> {selectedTransaction.notes}
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Daftar Produk yang Dipesan
                </span>
                <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-white">
                  {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                    selectedTransaction.items.map((it, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-center text-sm">
                        <div>
                          <div className="font-bold text-text-primary">
                            {it.product_name}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            {it.quantity} x {formatRupiah(it.unit_price)}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-text-primary">
                          {formatRupiah(it.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400 italic">
                      Tidak ada detail item
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Total Summary */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-950/5 space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold uppercase text-text-primary">
                    {selectedTransaction.payment_method}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span>Status Transaksi</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="border-t border-amber-950/10 pt-2 flex justify-between items-center">
                  <span className="font-bold text-text-primary">Total Pembayaran</span>
                  <span className="font-mono font-extrabold text-lg text-brand-red">
                    {formatRupiah(selectedTransaction.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#FDFBF7] flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-text-primary font-bold text-sm transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
